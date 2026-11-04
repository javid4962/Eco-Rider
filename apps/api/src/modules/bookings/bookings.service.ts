import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, In } from 'typeorm';
import {
  ApiErrorCode,
  BookingDetailsResponse,
  RideStatus,
  RideActorRole,
  VALID_RIDE_TRANSITIONS,
  TERMINAL_RIDE_STATUSES,
  TransitionRideStatusResponse,
  RideTimelineResponse,
  CancelRidePolicyResponse,
  RideIncidentDto,
  RideLedgerEntryDto,
  RotateStartOtpResponse,
} from '@ecoride/contracts';
import { Booking } from '../../database/entities/booking.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { RideStateEvent } from '../../database/entities/ride-state-event.entity';
import { RideIncident } from '../../database/entities/ride-incident.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { QuotesService } from '../quotes/quotes.service';
import { ZonesService } from '../zones/zones.service';
import { CreateBookingFromQuoteDto } from './dto/create-booking-from-quote.dto';
import { CreateRideIncidentDto } from './dto/create-ride-incident.dto';
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
    idempotencyKeyHeader?: string,
  ): Promise<BookingDetailsResponse> {
    const effectiveIdempotencyKey = (idempotencyKeyHeader || dto.idempotencyKey || '').trim();
    if (!effectiveIdempotencyKey) {
      throw new BadRequestException({
        code: ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED,
        message:
          'Idempotency-Key header or idempotencyKey body field is required for ride booking deduplication.',
      });
    }

    try {
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
          if (quote.idempotencyKey === effectiveIdempotencyKey && quote.bookingId) {
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
          where: { idempotencyKey: effectiveIdempotencyKey },
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
             "start_otp", "start_otp_expires_at", "start_otp_failed_attempts",
             "fare_amount", "quote_id", "fare_rule_id", "fare_rule_version",
             "idempotency_key", "passenger_count", "created_at", "updated_at"
           )
           VALUES (
             $1, $2, $3, $4, 'CREATED',
             ST_SetSRID(ST_MakePoint($5, $6), 4326), ST_SetSRID(ST_MakePoint($7, $8), 4326),
             $9, NOW() + INTERVAL '30 minutes', 0,
             $10, $11, $12, $13,
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
            effectiveIdempotencyKey,
            quote.passengerCount || 1,
          ],
        );

        // 8. Atomically transition Quote to CONSUMED
        quote.status = 'CONSUMED';
        quote.consumedAt = new Date();
        quote.bookingId = bookingId;
        quote.idempotencyKey = effectiveIdempotencyKey;
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
            idempotencyKey: effectiveIdempotencyKey,
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
          idempotencyKey: effectiveIdempotencyKey,
          passengerCount: quote.passengerCount || 1,
          pickupLatitude: Number(quote.pickupLatitude),
          pickupLongitude: Number(quote.pickupLongitude),
          dropoffLatitude: Number(quote.dropoffLatitude),
          dropoffLongitude: Number(quote.dropoffLongitude),
          createdAt: new Date().toISOString(),
        };
      });
    } catch (err: unknown) {
      const dbErr = err as { code?: string; message?: string };
      if (
        dbErr?.code === '23505' ||
        (typeof dbErr?.message === 'string' &&
          (dbErr.message.includes('idx_bookings_idempotency_unique') ||
            dbErr.message.includes('idempotency_key')))
      ) {
        const existing = await this.dataSource.manager.findOne(Booking, {
          where: { idempotencyKey: effectiveIdempotencyKey },
        });
        if (existing) {
          const found = await this.findBookingWithCoords(this.dataSource.manager, existing.id);
          if (found) return found;
        }
      }
      throw err;
    }
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
    if (dto.targetStatus === RideStatus.CANCELLED) {
      return this.cancelRide(
        bookingId,
        actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
        { reason: dto.reason, metadata: dto.metadata },
      );
    }

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
        if (
          dto.targetStatus === RideStatus.IN_PROGRESS &&
          normalizedFromStatus === RideStatus.ASSIGNED
        ) {
          throw new BadRequestException({
            code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
            message: `Illegal status transition from 'ASSIGNED' to 'IN_PROGRESS'. Trip cannot be started before captain marks arrival at pickup.`,
          });
        }
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
          // Refresh or extend OTP expiration window so rider has at least 15 minutes to board
          const minExpiry = new Date(now.getTime() + 15 * 60 * 1000);
          if (!booking.startOtpExpiresAt || new Date(booking.startOtpExpiresAt) < minExpiry) {
            booking.startOtpExpiresAt = minExpiry;
          }
          break;
        }

        case RideStatus.IN_PROGRESS: {
          // Enforce 4-digit start OTP check for captains and non-admin actors
          if (!['ADMIN', 'SAFETY_OFFICER', 'SYSTEM'].includes(effectiveActorRole)) {
            // 1. Throttle / Lockout check
            if (booking.startOtpLockedUntil && now < new Date(booking.startOtpLockedUntil)) {
              const remainingSeconds = Math.ceil(
                (new Date(booking.startOtpLockedUntil).getTime() - now.getTime()) / 1000,
              );
              throw new BadRequestException({
                code: ApiErrorCode.OTP_ATTEMPTS_EXCEEDED,
                message: `Too many failed OTP attempts. Start verification is locked for another ${remainingSeconds} seconds. Rider can rotate OTP to unlock immediately.`,
              });
            }

            // 2. Expiration check
            if (booking.startOtpExpiresAt && now > new Date(booking.startOtpExpiresAt)) {
              throw new BadRequestException({
                code: ApiErrorCode.OTP_EXPIRED,
                message: `Rider start OTP has expired. Please ask the rider to rotate or generate a new OTP.`,
              });
            }

            // 3. Match check & attempt tracking
            if (!dto.startOtp || dto.startOtp !== booking.startOtp) {
              booking.startOtpFailedAttempts = (booking.startOtpFailedAttempts || 0) + 1;
              if (booking.startOtpFailedAttempts >= 3) {
                // Lock out for 5 minutes
                booking.startOtpLockedUntil = new Date(now.getTime() + 5 * 60 * 1000);
                await manager.save(booking);
                throw new BadRequestException({
                  code: ApiErrorCode.OTP_ATTEMPTS_EXCEEDED,
                  message: `Incorrect OTP entered 3 times. Verification locked for 5 minutes. Rider can rotate OTP to unlock immediately.`,
                });
              } else {
                await manager.save(booking);
                const remaining = 3 - booking.startOtpFailedAttempts;
                throw new BadRequestException({
                  code: ApiErrorCode.INVALID_START_OTP,
                  message: `Invalid 4-digit ride start OTP provided. ${remaining} attempt(s) remaining.`,
                });
              }
            }

            // On success: reset failed attempts & lockout
            booking.startOtpFailedAttempts = 0;
            booking.startOtpLockedUntil = null;
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

  /**
   * Rotates and regenerates the 4-digit rider start OTP (EV-045).
   * Restricted to the rider who owns the ride or platform administrators.
   * Clears any active OTP attempt locks, resets failed attempts,
   * sets a fresh 15-minute expiration window, and enforces a 30-second rotation cooldown.
   */
  async rotateStartOtp(
    bookingId: string,
    actor?: CurrentActorPayload,
    metadata?: Record<string, unknown>,
  ): Promise<RotateStartOtpResponse> {
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
          message: `Ride '${bookingId}' has already reached terminal status '${currentStatus}' and OTP cannot be rotated.`,
        });
      }

      // Cannot rotate OTP if ride is already in progress
      if (booking.status === RideStatus.IN_PROGRESS) {
        throw new BadRequestException({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
          message: `Cannot rotate start OTP while trip is already IN_PROGRESS.`,
        });
      }

      // 3. Authorization check: Only booking rider, admin, safety officer, or system can rotate OTP
      const effectiveActorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
      const effectiveActorId = actor?.id || '00000000-0000-0000-0000-000000000000';
      const isAdminOrOps = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'SAFETY_OFFICER', 'SYSTEM'].includes(
        effectiveActorRole,
      );

      if (effectiveActorRole === 'CAPTAIN') {
        throw new ForbiddenException({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
          message: `Captains cannot regenerate rider OTP. Only the passenger or authorized support can rotate the OTP.`,
        });
      }

      if (effectiveActorRole === 'RIDER') {
        if (booking.riderId !== effectiveActorId) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Access denied: Booking belongs to another rider account. Cross-account OTP rotation is prohibited.`,
          });
        }
      } else if (!isAdminOrOps) {
        throw new ForbiddenException({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
          message: `Actor role '${effectiveActorRole}' is not authorized to rotate start OTP.`,
        });
      }

      const now = new Date();

      // 4. Rate-limit cooldown (30 seconds between rotations, bypassable only by ADMIN/SYSTEM)
      if (booking.startOtpRotatedAt && !['ADMIN', 'SYSTEM'].includes(effectiveActorRole)) {
        const elapsedMs = now.getTime() - new Date(booking.startOtpRotatedAt).getTime();
        const cooldownMs = 30 * 1000;
        if (elapsedMs < cooldownMs) {
          const waitSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
          throw new HttpException(
            {
              code: ApiErrorCode.RATE_LIMITED,
              message: `OTP rotation requested too quickly. Please wait ${waitSeconds} second(s) before generating a new OTP.`,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // 5. Generate new distinct 4-digit OTP
      let newOtp: string;
      do {
        newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      } while (newOtp === booking.startOtp);

      booking.startOtp = newOtp;
      booking.startOtpRotatedAt = now;
      booking.startOtpExpiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute TTL
      booking.startOtpFailedAttempts = 0;
      booking.startOtpLockedUntil = null;
      booking.updatedAt = now;

      await manager.save(booking);

      // 6. Record immutable event in ride_state_events
      const event = manager.create(RideStateEvent, {
        id: randomUUID(),
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: booking.status,
        actorId: effectiveActorId,
        actorRole: effectiveActorRole,
        metadata: {
          ...(metadata || {}),
          action: 'OTP_ROTATED',
          rotatedAt: now.toISOString(),
          expiresAt: booking.startOtpExpiresAt.toISOString(),
          ipAddress: actor?.ipAddress,
          correlationId: actor?.correlationId,
        },
      });
      await manager.save(event);

      const isRiderOrAdmin = effectiveActorRole === 'RIDER' || isAdminOrOps;

      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        startOtp: isRiderOrAdmin ? newOtp : undefined,
        expiresAt: booking.startOtpExpiresAt.toISOString(),
        rotatedAt: booking.startOtpRotatedAt.toISOString(),
        remainingAttempts: 3,
      };
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
  ): Promise<CancelRidePolicyResponse> {
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

      const normalizedFromStatus =
        booking.status === 'CREATED' ? RideStatus.REQUESTED : (booking.status as RideStatus);

      // 3. Actor authorization checks
      const effectiveActorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
      const effectiveActorId = actor?.id || '00000000-0000-0000-0000-000000000000';

      const isAdminOrOps = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'SAFETY_OFFICER', 'SYSTEM'].includes(
        effectiveActorRole,
      );

      if (effectiveActorRole === 'RIDER') {
        if (
          booking.riderId !== effectiveActorId &&
          effectiveActorId !== '00000000-0000-0000-0000-000000000000'
        ) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Access denied: Booking belongs to another rider account. Cross-account ride management is prohibited.`,
          });
        }
        if (normalizedFromStatus === RideStatus.IN_PROGRESS) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Riders cannot unilaterally cancel a ride in progress. Please contact safety support or the operations desk.`,
          });
        }
      } else if (effectiveActorRole === 'CAPTAIN') {
        if (
          booking.captainId &&
          booking.captainId !== effectiveActorId &&
          effectiveActorId !== '00000000-0000-0000-0000-000000000000'
        ) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Access denied: Only the assigned captain can cancel this ride.`,
          });
        }
        if (![RideStatus.ASSIGNED, RideStatus.ARRIVED].includes(normalizedFromStatus)) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Captains can only cancel rides in ASSIGNED or ARRIVED status.`,
          });
        }
      } else if (!isAdminOrOps) {
        throw new ForbiddenException({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
          message: `Actor role '${effectiveActorRole}' is not authorized to cancel ride.`,
        });
      }

      const now = new Date();
      let cancellationFeePaise = 0;
      let gracePeriodExpired = false;

      // 4. Calculate cancellation fee policy based on actor and ride state
      if (effectiveActorRole === 'RIDER') {
        if (normalizedFromStatus === RideStatus.ASSIGNED) {
          const assignedAtTime = booking.assignedAt
            ? booking.assignedAt.getTime()
            : booking.createdAt.getTime();
          const elapsedMs = now.getTime() - assignedAtTime;
          // Grace period: 3 minutes (180,000 ms)
          if (elapsedMs > 180_000) {
            cancellationFeePaise = 1500; // ₹15.00 statutory driver compensation
            gracePeriodExpired = true;
          }
        } else if (normalizedFromStatus === RideStatus.ARRIVED) {
          // Captain has already arrived at pickup
          cancellationFeePaise = 1500; // ₹15.00 statutory driver compensation
          gracePeriodExpired = true;
        }
      }

      // 5. Update booking entity
      const previousStatus = booking.status;
      booking.status = RideStatus.CANCELLED;
      booking.cancelledAt = now;
      booking.cancellationReason = dto.reason || `Cancelled by ${effectiveActorRole}`;
      booking.cancelledByRole = effectiveActorRole;
      booking.cancelledById = effectiveActorId;
      booking.cancellationFeePaise = cancellationFeePaise;
      booking.updatedAt = now;
      await manager.save(booking);

      // 6. Create balanced double-entry ledger entries if cancellation fee > 0
      let ledgerEntriesCreated = 0;
      if (cancellationFeePaise > 0) {
        const debitEntry = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `cancel-debit-${booking.id}-${now.getTime()}`,
          bookingId: booking.id,
          accountId: `rider:${booking.riderId}`,
          entryType: 'DEBIT',
          amountPaise: cancellationFeePaise,
          currency: 'INR',
          description: `Statutory cancellation fee for booking ${booking.bookingCode}`,
          createdAt: now,
        });

        const creditEntry = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `cancel-credit-${booking.id}-${now.getTime()}`,
          bookingId: booking.id,
          accountId: booking.captainId
            ? `captain:${booking.captainId}`
            : 'platform:compensation_pool',
          entryType: 'CREDIT',
          amountPaise: cancellationFeePaise,
          currency: 'INR',
          description: `Captain compensation for rider cancellation on ${booking.bookingCode}`,
          createdAt: now,
        });

        await manager.save(LedgerEntry, [debitEntry, creditEntry]);
        ledgerEntriesCreated = 2;
      }

      // 7. Verify active incidents and ledger entries are strictly preserved
      const activeIncidents = await manager.find(RideIncident, {
        where: {
          bookingId: booking.id,
          status: Not(In(['RESOLVED', 'CLOSED'])),
        },
      });

      // 8. Record immutable transition audit event in ride_state_events
      const event = manager.create(RideStateEvent, {
        id: randomUUID(),
        bookingId: booking.id,
        fromStatus: previousStatus === 'CREATED' ? RideStatus.REQUESTED : previousStatus,
        toStatus: RideStatus.CANCELLED,
        actorId: effectiveActorId,
        actorRole: effectiveActorRole,
        metadata: {
          ...(dto.metadata || {}),
          reason: dto.reason || booking.cancellationReason,
          cancellationFeePaise,
          formattedCancellationFee: `₹${(cancellationFeePaise / 100).toFixed(2)}`,
          gracePeriodExpired,
          ledgerEntriesCreated,
          ledgerEntriesPreserved: true,
          activeIncidentsCount: activeIncidents.length,
          activeIncidentCodes: activeIncidents.map((i) => i.incidentCode),
        },
      });
      await manager.save(event);

      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        previousStatus,
        currentStatus: RideStatus.CANCELLED,
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
          cancelledAt: booking.cancelledAt.toISOString(),
          failedAt: booking.failedAt ? booking.failedAt.toISOString() : null,
        },
        cancellationDetails: {
          reason: booking.cancellationReason || '',
          cancelledByRole: booking.cancelledByRole || '',
          cancelledById: booking.cancelledById || '',
        },
        failureDetails: null,
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
        cancellationFeePaise,
        formattedCancellationFee: `₹${(cancellationFeePaise / 100).toFixed(2)}`,
        gracePeriodExpired,
        ledgerEntriesCreated,
        ledgerEntriesPreserved: true,
        activeIncidentsCount: activeIncidents.length,
        activeIncidents: activeIncidents.map((i) => ({
          id: i.id,
          incidentCode: i.incidentCode,
          incidentType: i.incidentType,
          severity: i.severity,
          status: i.status,
        })),
      };
    });
  }

  /**
   * Reports a safety or operational incident on a ride.
   * Incident is immutable and cannot be erased by cancellation.
   */
  async createRideIncident(
    bookingId: string,
    actor: CurrentActorPayload | undefined,
    dto: CreateRideIncidentDto,
  ): Promise<RideIncidentDto> {
    const booking = await this.dataSource.manager.findOne(Booking, {
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking with ID '${bookingId}' not found.`,
      });
    }

    const effectiveActorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const effectiveActorId = actor?.id || '00000000-0000-0000-0000-000000000000';

    const incidentCode = `INC-${booking.bookingCode.replace('ECO-VZ-', '')}-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const incident = this.dataSource.manager.create(RideIncident, {
      id: randomUUID(),
      bookingId: booking.id,
      incidentCode,
      incidentType: dto.incidentType,
      severity: dto.severity || 'MEDIUM',
      status: 'REPORTED',
      reportedById: effectiveActorId,
      reportedByRole: effectiveActorRole,
      description: dto.description,
      metadata: dto.metadata || {},
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.dataSource.manager.save(RideIncident, incident);

    return {
      id: saved.id,
      bookingId: saved.bookingId,
      incidentCode: saved.incidentCode,
      incidentType: saved.incidentType,
      severity: saved.severity,
      status: saved.status,
      reportedById: saved.reportedById,
      reportedByRole: saved.reportedByRole,
      description: saved.description,
      metadata: saved.metadata,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves all incidents recorded for a booking.
   */
  async getRideIncidents(
    bookingId: string,
    actor?: CurrentActorPayload,
  ): Promise<RideIncidentDto[]> {
    const booking = await this.dataSource.manager.findOne(Booking, {
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking with ID '${bookingId}' not found.`,
      });
    }

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
          message: `Access denied: Cannot access incidents for another rider's booking.`,
        });
      }
      if (
        effectiveActorRole === 'CAPTAIN' &&
        booking.captainId &&
        booking.captainId !== effectiveActorId
      ) {
        throw new ForbiddenException({
          code: ApiErrorCode.FORBIDDEN,
          message: `Access denied: Cannot access incidents for another captain's booking.`,
        });
      }
    }

    const incidents = await this.dataSource.manager.find(RideIncident, {
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });

    return incidents.map((i) => ({
      id: i.id,
      bookingId: i.bookingId,
      incidentCode: i.incidentCode,
      incidentType: i.incidentType,
      severity: i.severity,
      status: i.status,
      reportedById: i.reportedById,
      reportedByRole: i.reportedByRole,
      description: i.description,
      metadata: i.metadata,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));
  }

  /**
   * Retrieves all financial ledger entries linked to a booking.
   */
  async getRideLedgerEntries(
    bookingId: string,
    actor?: CurrentActorPayload,
  ): Promise<RideLedgerEntryDto[]> {
    const booking = await this.dataSource.manager.findOne(Booking, {
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking with ID '${bookingId}' not found.`,
      });
    }

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
          message: `Access denied: Cannot access ledger records for another rider's booking.`,
        });
      }
    }

    const entries = await this.dataSource.manager.find(LedgerEntry, {
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });

    return entries.map((e) => ({
      id: e.id,
      bookingId: e.bookingId,
      accountId: e.accountId,
      entryType: e.entryType,
      amountPaise: Number(e.amountPaise),
      currency: e.currency,
      description: e.description || null,
      idempotencyKey: e.idempotencyKey,
      createdAt: e.createdAt.toISOString(),
    }));
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
