import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  ApiErrorCode,
  BookingDetailsResponse,
  RideStatus,
  RideActorRole,
  VALID_RIDE_TRANSITIONS,
  TERMINAL_RIDE_STATUSES,
  TransitionRideStatusResponse,
  RideTimelineResponse,
} from '@ecoride/contracts';
import { Booking } from '../../database/entities/booking.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { RideStateEvent } from '../../database/entities/ride-state-event.entity';
import { QuotesService } from '../quotes/quotes.service';
import { ZonesService } from '../zones/zones.service';
import { CreateBookingFromQuoteDto } from './dto/create-booking-from-quote.dto';
import {
  TransitionRideStatusDto,
  AssignCaptainDto,
  StartRideDto,
  CancelRideDto,
  FailRideDto,
} from './dto/transition-ride-status.dto';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import { randomUUID } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly quotesService: QuotesService,
    @Optional()
    private readonly zonesService?: ZonesService,
  ) {}

  /**
   * Creates an authoritative EV ride booking from an eligible quote inside
   * an ACID transaction with pessimistic row lock on the quote.
   * Enforces replay prevention, idempotency, expiration, cross-account security,
   * cryptographic token verification, and interim zone revocation safeguards.
   */
  async createBookingFromQuote(
    actorUserId: string | undefined,
    dto: CreateBookingFromQuoteDto,
  ): Promise<BookingDetailsResponse> {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Fetch quote with pessimistic write lock to prevent concurrent double-booking
      const quote = await manager
        .createQueryBuilder(RideQuote, 'q')
        .setLock('pessimistic_write')
        .where('q.id = :id', { id: dto.quoteId })
        .getOne();

      if (!quote) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Quote with ID '${dto.quoteId}' not found.`,
        });
      }

      // 2. Replay & Idempotency Safeguards
      if (quote.status === 'CONSUMED') {
        if (dto.idempotencyKey && quote.idempotencyKey === dto.idempotencyKey && quote.bookingId) {
          const existing = await this.findBookingWithCoords(manager, quote.bookingId);
          if (existing) {
            return existing;
          }
        }
        throw new ConflictException({
          code: ApiErrorCode.CONFLICT,
          message: `Quote '${dto.quoteId}' has already been consumed for booking '${quote.bookingId}'. Replaying quotes across multiple bookings is prohibited.`,
        });
      }

      // Check if existing booking exists with this idempotency key
      const existingWithKey = await manager.findOne(Booking, {
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingWithKey) {
        const found = await this.findBookingWithCoords(manager, existingWithKey.id);
        if (found) return found;
      }

      // 3. Cross-Account Security Checks
      const effectiveRiderId = actorUserId || dto.riderId || quote.riderId;
      if (quote.riderId && actorUserId && quote.riderId !== actorUserId) {
        throw new ForbiddenException({
          code: ApiErrorCode.FORBIDDEN,
          message: `Access denied: Quote belongs to rider '${quote.riderId}'. Cross-account ride booking is strictly prohibited.`,
        });
      }
      if (quote.riderId && dto.riderId && quote.riderId !== dto.riderId) {
        throw new ForbiddenException({
          code: ApiErrorCode.FORBIDDEN,
          message: `Access denied: Quote belongs to rider '${quote.riderId}'. Cross-account ride booking is strictly prohibited.`,
        });
      }

      // 4. Expiration Verification
      const isExpired = new Date(quote.expiresAt).getTime() <= Date.now();
      if (isExpired) {
        if (quote.status === 'ACTIVE') {
          quote.status = 'EXPIRED';
          await manager.save(quote);
        }
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Quote '${quote.id}' expired at ${quote.expiresAt.toISOString()}. Please request a fresh fare quote.`,
        });
      }

      // 5. Tampering & Cryptographic Token Verification
      if (dto.quoteToken) {
        const tokenCheck = this.quotesService.verifyQuoteToken(dto.quoteToken);
        if (!tokenCheck.isValid || !tokenCheck.payload) {
          throw new BadRequestException({
            code: ApiErrorCode.BAD_REQUEST,
            message: `Quote token signature is invalid or tampered: ${tokenCheck.reason || 'TAMPERED_SIGNATURE'}. Client-side fare overrides are strictly rejected.`,
          });
        }

        const p = tokenCheck.payload;
        if (
          p.quoteId !== quote.id ||
          p.fareRuleId !== quote.fareRuleId ||
          p.fareRuleVersion !== quote.fareRuleVersion ||
          p.totalFarePaise !== quote.totalFarePaise ||
          p.serviceCategory !== quote.serviceCategory ||
          p.passengerCount !== quote.passengerCount
        ) {
          throw new BadRequestException({
            code: ApiErrorCode.BAD_REQUEST,
            message: `Quote token payload does not match authoritative database quote. Tampering detected.`,
          });
        }
      }

      // Context mismatch checks
      if (dto.serviceCategory && dto.serviceCategory !== quote.serviceCategory) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested service category '${dto.serviceCategory}' does not match pinned quote category '${quote.serviceCategory}'.`,
        });
      }

      if (dto.passengerCount !== undefined && dto.passengerCount !== quote.passengerCount) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested passenger count ${dto.passengerCount} does not match pinned quote passenger count ${quote.passengerCount}.`,
        });
      }

      if (
        dto.pickupLatitude !== undefined &&
        Math.abs(Number(dto.pickupLatitude) - Number(quote.pickupLatitude)) > 0.0001
      ) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested pickup latitude does not match pinned quote location.`,
        });
      }

      if (
        dto.dropoffLatitude !== undefined &&
        Math.abs(Number(dto.dropoffLatitude) - Number(quote.dropoffLatitude)) > 0.0001
      ) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested dropoff latitude does not match pinned quote location.`,
        });
      }

      // 6. Post-Quote Zone & Category Switch Revocation Safeguard
      if (this.zonesService) {
        const zoneCheck = await this.zonesService.verifyLocation({
          city: quote.city,
          latitude: Number(quote.pickupLatitude),
          longitude: Number(quote.pickupLongitude),
          serviceCategory: quote.serviceCategory,
        });

        if (!zoneCheck.isAuthorized) {
          if (quote.status === 'ACTIVE') {
            quote.status = 'REVOKED';
            await manager.save(quote);
          }
          throw new BadRequestException({
            code: ApiErrorCode.ZONE_RESTRICTED,
            message:
              zoneCheck.rejectionReason ||
              `Service category '${quote.serviceCategory}' or operational zone in '${quote.city}' was revoked after quote generation.`,
          });
        }
      }

      // 7. Insert Booking with pinned values and PostGIS geometry points
      const bookingId = randomUUID();
      const bookingCode = `ECO-VZ-${bookingId.substring(0, 8).toUpperCase()}`;
      const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const fareAmountRupees = quote.totalFarePaise / 100;
      const rider = effectiveRiderId || 'b0000000-0000-4000-8000-000000000001';

      await manager.query(
        `INSERT INTO "bookings" (
           "id", "booking_code", "rider_id", "service_category", "status",
           "pickup_location", "dropoff_location",
           "start_otp", "fare_amount", "quote_id", "fare_rule_id", "fare_rule_version",
           "idempotency_key", "passenger_count", "created_at", "updated_at"
         )
         VALUES (
           $1, $2, $3, $4, 'CREATED',
           ST_SetSRID(ST_MakePoint($5, $6), 4326), ST_SetSRID(ST_MakePoint($7, $8), 4326),
           $9, $10, $11, $12, $13,
           $14, $15, NOW(), NOW()
         )`,
        [
          bookingId,
          bookingCode,
          rider,
          quote.serviceCategory,
          Number(quote.pickupLongitude),
          Number(quote.pickupLatitude),
          Number(quote.dropoffLongitude),
          Number(quote.dropoffLatitude),
          startOtp,
          fareAmountRupees,
          quote.id,
          quote.fareRuleId,
          quote.fareRuleVersion,
          dto.idempotencyKey,
          quote.passengerCount || 1,
        ],
      );

      // 8. Atomically transition Quote to CONSUMED
      quote.status = 'CONSUMED';
      quote.consumedAt = new Date();
      quote.bookingId = bookingId;
      quote.idempotencyKey = dto.idempotencyKey;
      await manager.save(quote);

      // 9. Record initial requested state event in immutable ride_state_events
      const initialEvent = manager.create(RideStateEvent, {
        id: randomUUID(),
        bookingId,
        fromStatus: null,
        toStatus: RideStatus.REQUESTED,
        actorId: rider,
        actorRole: RideActorRole.RIDER,
        metadata: {
          bookingCode,
          fareAmountRupees,
          fareAmountPaise: quote.totalFarePaise,
          serviceCategory: quote.serviceCategory,
          initialCreation: true,
        },
      });
      await manager.save(initialEvent);

      return {
        bookingId,
        bookingCode,
        riderId: rider,
        quoteId: quote.id,
        fareRuleId: quote.fareRuleId,
        fareRuleVersion: quote.fareRuleVersion,
        serviceCategory: quote.serviceCategory,
        status: 'CREATED',
        fareAmountRupees,
        fareAmountPaise: quote.totalFarePaise,
        startOtp,
        idempotencyKey: dto.idempotencyKey,
        passengerCount: quote.passengerCount || 1,
        pickupLatitude: Number(quote.pickupLatitude),
        pickupLongitude: Number(quote.pickupLongitude),
        dropoffLatitude: Number(quote.dropoffLatitude),
        dropoffLongitude: Number(quote.dropoffLongitude),
        createdAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Retrieves booking details by ID and verifies caller authorization.
   */
  async getBooking(id: string, actorUserId?: string): Promise<BookingDetailsResponse> {
    const res = await this.findBookingWithCoords(this.dataSource.manager, id);
    if (!res) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking with ID '${id}' not found.`,
      });
    }

    if (
      actorUserId &&
      actorUserId !== '00000000-0000-0000-0000-000000000000' &&
      res.riderId !== actorUserId
    ) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: `Access denied: Booking belongs to another rider account.`,
      });
    }

    return res;
  }

  private async findBookingWithCoords(
    manager: EntityManager,
    bookingId: string,
  ): Promise<BookingDetailsResponse | null> {
    const rows = await manager.query(
      `SELECT
         b.id,
         b.booking_code,
         b.rider_id,
         b.service_category,
         b.status,
         b.start_otp,
         b.fare_amount,
         b.quote_id,
         b.fare_rule_id,
         b.fare_rule_version,
         b.idempotency_key,
         b.passenger_count,
         b.created_at,
         ST_Y(b.pickup_location::geometry) as pickup_latitude,
         ST_X(b.pickup_location::geometry) as pickup_longitude,
         ST_Y(b.dropoff_location::geometry) as dropoff_latitude,
         ST_X(b.dropoff_location::geometry) as dropoff_longitude
       FROM "bookings" b
       WHERE b.id = $1`,
      [bookingId],
    );

    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    return {
      bookingId: row.id,
      bookingCode: row.booking_code,
      riderId: row.rider_id,
      quoteId: row.quote_id,
      fareRuleId: row.fare_rule_id,
      fareRuleVersion: row.fare_rule_version,
      serviceCategory: row.service_category,
      status: row.status,
      fareAmountRupees: Number(row.fare_amount),
      fareAmountPaise: Math.round(Number(row.fare_amount) * 100),
      startOtp: row.start_otp,
      idempotencyKey: row.idempotency_key,
      passengerCount: Number(row.passenger_count || 1),
      pickupLatitude: Number(row.pickup_latitude),
      pickupLongitude: Number(row.pickup_longitude),
      dropoffLatitude: Number(row.dropoff_latitude),
      dropoffLongitude: Number(row.dropoff_longitude),
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  /**
   * Authoritatively transitions ride status through the legal state machine DAG.
   * Enforces pessimistic locking, actor role authorization, OTP verification,
   * required field constraints, timestamp stamping, and append-only event logging.
   */
  async transitionRideStatus(
    bookingId: string,
    actor: CurrentActorPayload | undefined,
    dto: TransitionRideStatusDto,
  ): Promise<TransitionRideStatusResponse> {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Fetch booking with pessimistic write lock
      const booking = await manager
        .createQueryBuilder(Booking, 'b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: bookingId })
        .getOne();

      if (!booking) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Booking with ID '${bookingId}' not found.`,
        });
      }

      // 2. Terminal state check
      const currentStatus = booking.status as RideStatus;
      if (TERMINAL_RIDE_STATUSES.includes(currentStatus)) {
        throw new ConflictException({
          code: ApiErrorCode.RIDE_ALREADY_TERMINATED,
          message: `Ride '${bookingId}' has already reached terminal status '${currentStatus}' and cannot be transitioned further.`,
        });
      }

      // 3. Normalize initial state: 'CREATED' is treated as 'REQUESTED'
      const normalizedFromStatus =
        booking.status === 'CREATED' ? RideStatus.REQUESTED : (booking.status as RideStatus);

      // 4. Validate DAG transition
      const legalNextStatuses = VALID_RIDE_TRANSITIONS[normalizedFromStatus] || [];
      if (!legalNextStatuses.includes(dto.targetStatus)) {
        throw new BadRequestException({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
          message: `Illegal status transition from '${booking.status}' to '${dto.targetStatus}'. Valid target statuses are: ${legalNextStatuses.join(', ') || 'none (terminal)'}.`,
        });
      }

      // 5. Actor authorization checks
      const effectiveActorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
      const effectiveActorId = actor?.id || '00000000-0000-0000-0000-000000000000';

      const isAdminOrOps = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'SAFETY_OFFICER', 'SYSTEM'].includes(
        effectiveActorRole,
      );

      if (effectiveActorRole === 'RIDER') {
        // Must own the booking
        if (booking.riderId !== effectiveActorId) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Access denied: Booking belongs to another rider account. Cross-account ride management is prohibited.`,
          });
        }

        // Rider can only request dispatch or cancel (before ride is in-progress)
        if (dto.targetStatus === RideStatus.CANCELLED) {
          if (normalizedFromStatus === RideStatus.IN_PROGRESS) {
            throw new ForbiddenException({
              code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
              message: `Riders cannot unilaterally cancel a ride in progress. Please contact safety support or the operations desk.`,
            });
          }
        } else if (dto.targetStatus !== RideStatus.DISPATCHING) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Riders are not authorized to transition ride to status '${dto.targetStatus}'.`,
          });
        }
      } else if (effectiveActorRole === 'CAPTAIN') {
        if (dto.targetStatus === RideStatus.ASSIGNED) {
          // Captain claiming/accepting dispatch
          if (dto.captainId && dto.captainId !== effectiveActorId) {
            throw new ForbiddenException({
              code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
              message: `Captains can only accept dispatches for themselves.`,
            });
          }
        } else {
          // For transitions after assignment (ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED):
          // Only the assigned captain can execute the transition
          if (!booking.captainId || booking.captainId !== effectiveActorId) {
            throw new ForbiddenException({
              code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
              message: `Access denied: Only the assigned captain ('${booking.captainId || 'none'}') can execute status transitions on this ride.`,
            });
          }

          // Captain cannot mark FAILED or DISPATCHING
          if (
            dto.targetStatus === RideStatus.FAILED ||
            dto.targetStatus === RideStatus.DISPATCHING
          ) {
            throw new ForbiddenException({
              code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
              message: `Captains cannot transition ride status to '${dto.targetStatus}'.`,
            });
          }
        }
      } else if (!isAdminOrOps) {
        throw new ForbiddenException({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
          message: `Actor role '${effectiveActorRole}' is not authorized to transition ride status.`,
        });
      }

      // 6. Transition-specific payload validations and timestamp assignments
      const previousStatus = booking.status;
      const now = new Date();

      switch (dto.targetStatus) {
        case RideStatus.DISPATCHING: {
          booking.dispatchingAt = now;
          break;
        }

        case RideStatus.ASSIGNED: {
          const assignedCaptainId =
            dto.captainId || (effectiveActorRole === 'CAPTAIN' ? effectiveActorId : undefined);
          const assignedVehicleId = dto.vehicleId;

          if (!assignedCaptainId || !assignedVehicleId) {
            throw new BadRequestException({
              code: ApiErrorCode.BAD_REQUEST,
              message: `Both 'captainId' and 'vehicleId' are required when assigning a ride to a captain.`,
            });
          }

          booking.captainId = assignedCaptainId;
          booking.vehicleId = assignedVehicleId;
          booking.assignedAt = now;
          break;
        }

        case RideStatus.ARRIVED: {
          booking.arrivedAt = now;
          break;
        }

        case RideStatus.IN_PROGRESS: {
          // Enforce 4-digit start OTP check for captains and non-admin actors
          if (!['ADMIN', 'SAFETY_OFFICER', 'SYSTEM'].includes(effectiveActorRole)) {
            if (!dto.startOtp || dto.startOtp !== booking.startOtp) {
              throw new BadRequestException({
                code: ApiErrorCode.INVALID_START_OTP,
                message: `Invalid 4-digit ride start OTP provided. Captain must enter the correct passenger OTP to start trip.`,
              });
            }
          }
          booking.tripStartedAt = now;
          break;
        }

        case RideStatus.COMPLETED: {
          booking.tripCompletedAt = now;
          break;
        }

        case RideStatus.CANCELLED: {
          booking.cancelledAt = now;
          booking.cancellationReason = dto.reason || `Cancelled by ${effectiveActorRole}`;
          booking.cancelledByRole = effectiveActorRole;
          booking.cancelledById = effectiveActorId;
          break;
        }

        case RideStatus.FAILED: {
          if (!dto.reason || !dto.reason.trim()) {
            throw new BadRequestException({
              code: ApiErrorCode.BAD_REQUEST,
              message: `A non-empty failure reason is required when transitioning a ride to FAILED.`,
            });
          }
          booking.failedAt = now;
          booking.failureReason = dto.reason.trim();
          break;
        }
      }

      // 7. Update booking entity
      booking.status = dto.targetStatus;
      booking.updatedAt = now;
      await manager.save(booking);

      // 8. Record immutable transition audit event in ride_state_events
      const event = manager.create(RideStateEvent, {
        id: randomUUID(),
        bookingId: booking.id,
        fromStatus: previousStatus === 'CREATED' ? RideStatus.REQUESTED : previousStatus,
        toStatus: dto.targetStatus,
        actorId: effectiveActorId,
        actorRole: effectiveActorRole,
        metadata: {
          ...(dto.metadata || {}),
          ipAddress: actor?.ipAddress,
          correlationId: actor?.correlationId,
          ...(dto.reason ? { reason: dto.reason } : {}),
          ...(booking.captainId ? { captainId: booking.captainId } : {}),
          ...(booking.vehicleId ? { vehicleId: booking.vehicleId } : {}),
        },
      });
      await manager.save(event);

      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        previousStatus,
        currentStatus: dto.targetStatus,
        riderId: booking.riderId,
        captainId: booking.captainId || null,
        vehicleId: booking.vehicleId || null,
        serviceCategory: booking.serviceCategory,
        timestamps: {
          requestedAt: booking.requestedAt
            ? booking.requestedAt.toISOString()
            : booking.createdAt.toISOString(),
          dispatchingAt: booking.dispatchingAt ? booking.dispatchingAt.toISOString() : null,
          assignedAt: booking.assignedAt ? booking.assignedAt.toISOString() : null,
          arrivedAt: booking.arrivedAt ? booking.arrivedAt.toISOString() : null,
          tripStartedAt: booking.tripStartedAt ? booking.tripStartedAt.toISOString() : null,
          tripCompletedAt: booking.tripCompletedAt ? booking.tripCompletedAt.toISOString() : null,
          cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
          failedAt: booking.failedAt ? booking.failedAt.toISOString() : null,
        },
        cancellationDetails: booking.cancelledAt
          ? {
              reason: booking.cancellationReason || '',
              cancelledByRole: booking.cancelledByRole || '',
              cancelledById: booking.cancelledById || '',
            }
          : null,
        failureDetails: booking.failedAt
          ? {
              reason: booking.failureReason || '',
            }
          : null,
        transitionEvent: {
          id: event.id,
          bookingId: event.bookingId,
          fromStatus: event.fromStatus ?? null,
          toStatus: event.toStatus,
          actorId: event.actorId,
          actorRole: event.actorRole,
          metadata: event.metadata,
          createdAt: event.createdAt ? event.createdAt.toISOString() : now.toISOString(),
        },
      };
    });
  }

  /**
   * Retrieves the immutable audit timeline of all state transitions for a booking.
   */
  async getBookingEvents(
    bookingId: string,
    actor?: CurrentActorPayload,
  ): Promise<RideTimelineResponse> {
    const booking = await this.dataSource.manager.findOne(Booking, {
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking with ID '${bookingId}' not found.`,
      });
    }

    // Scoped authorization: riders and captains can only view events for their own booking
    const effectiveActorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const effectiveActorId = actor?.id;

    const isAdminOrOps = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'SAFETY_OFFICER', 'SYSTEM'].includes(
      effectiveActorRole,
    );

    if (
      !isAdminOrOps &&
      effectiveActorId &&
      effectiveActorId !== '00000000-0000-0000-0000-000000000000'
    ) {
      if (effectiveActorRole === 'RIDER' && booking.riderId !== effectiveActorId) {
        throw new ForbiddenException({
          code: ApiErrorCode.FORBIDDEN,
          message: `Access denied: Cannot access event timeline for another rider's booking.`,
        });
      }
      if (
        effectiveActorRole === 'CAPTAIN' &&
        booking.captainId &&
        booking.captainId !== effectiveActorId
      ) {
        throw new ForbiddenException({
          code: ApiErrorCode.FORBIDDEN,
          message: `Access denied: Cannot access event timeline for another captain's booking.`,
        });
      }
    }

    const events = await this.dataSource.manager.find(RideStateEvent, {
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });

    return {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      currentStatus: booking.status,
      eventsCount: events.length,
      events: events.map((e) => ({
        id: e.id,
        bookingId: e.bookingId,
        fromStatus: e.fromStatus ?? null,
        toStatus: e.toStatus,
        actorId: e.actorId,
        actorRole: e.actorRole,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  // --- Convenience Semantic Transition Methods ---

  async dispatchRide(
    bookingId: string,
    actor: CurrentActorPayload,
    metadata?: Record<string, unknown>,
  ): Promise<TransitionRideStatusResponse> {
    return this.transitionRideStatus(bookingId, actor, {
      targetStatus: RideStatus.DISPATCHING,
      metadata,
    });
  }

  async assignCaptain(
    bookingId: string,
    actor: CurrentActorPayload,
    dto: AssignCaptainDto,
  ): Promise<TransitionRideStatusResponse> {
    return this.transitionRideStatus(bookingId, actor, {
      targetStatus: RideStatus.ASSIGNED,
      captainId: dto.captainId,
      vehicleId: dto.vehicleId,
      metadata: dto.metadata,
    });
  }

  async markCaptainArrived(
    bookingId: string,
    actor: CurrentActorPayload,
    metadata?: Record<string, unknown>,
  ): Promise<TransitionRideStatusResponse> {
    return this.transitionRideStatus(bookingId, actor, {
      targetStatus: RideStatus.ARRIVED,
      metadata,
    });
  }

  async startRideWithOtp(
    bookingId: string,
    actor: CurrentActorPayload,
    dto: StartRideDto,
  ): Promise<TransitionRideStatusResponse> {
    return this.transitionRideStatus(bookingId, actor, {
      targetStatus: RideStatus.IN_PROGRESS,
      startOtp: dto.startOtp,
      metadata: dto.metadata,
    });
  }

  async completeRide(
    bookingId: string,
    actor: CurrentActorPayload,
    metadata?: Record<string, unknown>,
  ): Promise<TransitionRideStatusResponse> {
    return this.transitionRideStatus(bookingId, actor, {
      targetStatus: RideStatus.COMPLETED,
      metadata,
    });
  }

  async cancelRide(
    bookingId: string,
    actor: CurrentActorPayload,
    dto: CancelRideDto,
  ): Promise<TransitionRideStatusResponse> {
    return this.transitionRideStatus(bookingId, actor, {
      targetStatus: RideStatus.CANCELLED,
      reason: dto.reason,
      metadata: dto.metadata,
    });
  }

  async failRide(
    bookingId: string,
    actor: CurrentActorPayload,
    dto: FailRideDto,
  ): Promise<TransitionRideStatusResponse> {
    return this.transitionRideStatus(bookingId, actor, {
      targetStatus: RideStatus.FAILED,
      reason: dto.reason,
      metadata: dto.metadata,
    });
  }
}
