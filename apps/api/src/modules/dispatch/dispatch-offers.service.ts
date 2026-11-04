import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import {
  ApiErrorCode,
  DispatchOfferStatus,
  DispatchOfferDeclineReason,
  DispatchOfferDto,
  AcceptDispatchOfferResponse,
  DeclineDispatchOfferResponse,
  TimeoutDispatchOfferResponse,
  DispatchOffersSummaryResponse,
  RideStatus,
  RideActorRole,
  RankingStrategy,
  CaptainAvailabilityStatus,
  DutyStatus,
  OutboxEventStatus,
  DispatchOutboxEventDto,
} from '@ecoride/contracts';
import { DispatchOffer } from '../../database/entities/dispatch-offer.entity';
import { Booking } from '../../database/entities/booking.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { RideStateEvent } from '../../database/entities/ride-state-event.entity';
import { DispatchOutboxEvent } from '../../database/entities/dispatch-outbox-event.entity';
import { CaptainAvailabilityService } from '../compliance/captain-availability.service';
import { DispatchOffersQueueService } from './dispatch-offers-queue.service';
import { CreateDispatchOfferDto, DeclineDispatchOfferDto, TimeoutDispatchOfferDto } from './dto';
import { CurrentActorPayload } from '../identity/current-actor.decorator';

export const DEFAULT_OFFER_TIMEOUT_SECONDS = 15;
export const MAX_REDISPATCH_ATTEMPTS = 3;

@Injectable()
export class DispatchOffersService implements OnModuleInit {
  private readonly logger = new Logger(DispatchOffersService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly queueService: DispatchOffersQueueService,
    @Optional()
    private readonly captainAvailabilityService?: CaptainAvailabilityService,
  ) {}

  onModuleInit(): void {
    // Register the timeout callback with the queue scheduler
    this.queueService.registerTimeoutHandler(async (offerId: string) => {
      try {
        await this.timeoutOffer(offerId, {
          triggeredBy: 'QUEUE_WORKER',
          reason: 'Offer response window expired',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Background offer timeout failed for ${offerId}: ${msg}`);
      }
    });
  }

  /**
   * Initiates dispatch matching for a ride booking and dispatches a timed offer to the top candidate.
   */
  async initiateDispatch(
    bookingId: string,
    options?: CreateDispatchOfferDto,
  ): Promise<DispatchOfferDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Fetch booking with write lock
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

      // Check if booking is already assigned or terminated
      if (booking.status === RideStatus.ASSIGNED || booking.captainId) {
        throw new ConflictException({
          code: ApiErrorCode.RIDE_ALREADY_TAKEN,
          message: `Booking '${bookingId}' is already assigned to a captain.`,
        });
      }

      if (
        booking.status === RideStatus.CANCELLED ||
        booking.status === RideStatus.COMPLETED ||
        booking.status === RideStatus.FAILED
      ) {
        throw new ConflictException({
          code: ApiErrorCode.RIDE_ALREADY_TERMINATED,
          message: `Booking '${bookingId}' has already reached terminal status '${booking.status}'.`,
        });
      }

      // Check if there is an existing PENDING offer that has not expired
      const now = new Date();
      const existingPending = await manager
        .createQueryBuilder(DispatchOffer, 'o')
        .where('o.booking_id = :bookingId', { bookingId })
        .andWhere('o.status = :status', { status: DispatchOfferStatus.PENDING })
        .andWhere('o.expires_at > :now', { now })
        .getOne();

      if (existingPending) {
        return this.toDto(existingPending);
      }

      // Transition booking to DISPATCHING if in REQUESTED
      if (booking.status === RideStatus.REQUESTED) {
        booking.status = RideStatus.DISPATCHING;
        booking.dispatchingAt = now;
        await manager.save(Booking, booking);

        const dispatchEvent = manager.create(RideStateEvent, {
          bookingId: booking.id,
          fromStatus: RideStatus.REQUESTED,
          toStatus: RideStatus.DISPATCHING,
          actorId: booking.riderId,
          actorRole: RideActorRole.SYSTEM,
          metadata: { trigger: 'DISPATCH_INITIATED' },
        });
        await manager.save(RideStateEvent, dispatchEvent);
      }

      // 2. Fetch all captains who have already received an offer for this booking
      const previousOffers = await manager
        .createQueryBuilder(DispatchOffer, 'o')
        .where('o.booking_id = :bookingId', { bookingId })
        .orderBy('o.offer_sequence', 'ASC')
        .getMany();

      const offeredCaptainIds = new Set(previousOffers.map((o) => o.captainId));
      const nextSequence = previousOffers.length + 1;

      if (previousOffers.length >= MAX_REDISPATCH_ATTEMPTS) {
        booking.status = RideStatus.FAILED;
        booking.failedAt = now;
        booking.failureReason = 'NO_CAPTAINS_ACCEPTED';
        await manager.save(Booking, booking);

        const failEvent = manager.create(RideStateEvent, {
          bookingId: booking.id,
          fromStatus: RideStatus.DISPATCHING,
          toStatus: RideStatus.FAILED,
          actorId: booking.riderId,
          actorRole: RideActorRole.SYSTEM,
          metadata: {
            reason: 'MAX_REDISPATCH_ATTEMPTS_EXCEEDED',
            totalOffers: previousOffers.length,
          },
        });
        await manager.save(RideStateEvent, failEvent);

        throw new BadRequestException({
          code: ApiErrorCode.MAX_REDISPATCH_ATTEMPTS_EXCEEDED,
          message: `Maximum redispatch attempts (${MAX_REDISPATCH_ATTEMPTS}) exceeded for booking '${bookingId}'.`,
        });
      }

      // 3. Resolve pickup coordinates
      const coords = this.extractCoordinates(booking.pickupLocation);

      // 4. Query nearby eligible captains
      let candidates: {
        captainId: string;
        vehicleId: string;
        distanceMeters: number;
        estimatedEtaMinutes: number;
        fairScore: number;
      }[] = [];

      if (this.captainAvailabilityService) {
        const rankingStrategy = options?.rankingStrategy || RankingStrategy.BALANCED_FAIR;
        const result = await this.captainAvailabilityService.selectNearbyEligibleCaptains({
          city: 'visakhapatnam',
          pickupLatitude: coords.latitude,
          pickupLongitude: coords.longitude,
          requestedSeats: booking.passengerCount,
          serviceCategory: booking.serviceCategory,
          rankingStrategy,
        });

        // Exclude previously offered captains to prevent repeating in the same redispatch chain
        candidates = result.candidates.filter((c) => !offeredCaptainIds.has(c.captainId));
      }

      if (candidates.length === 0) {
        booking.status = RideStatus.FAILED;
        booking.failedAt = now;
        booking.failureReason =
          previousOffers.length > 0 ? 'NO_CAPTAINS_ACCEPTED' : 'NO_ELIGIBLE_CAPTAINS_NEARBY';
        await manager.save(Booking, booking);

        const failEvent = manager.create(RideStateEvent, {
          bookingId: booking.id,
          fromStatus: RideStatus.DISPATCHING,
          toStatus: RideStatus.FAILED,
          actorId: booking.riderId,
          actorRole: RideActorRole.SYSTEM,
          metadata: {
            reason: booking.failureReason,
            candidatesEvaluated: 0,
          },
        });
        await manager.save(RideStateEvent, failEvent);

        throw new BadRequestException({
          code: ApiErrorCode.NO_ELIGIBLE_CAPTAINS_NEARBY,
          message: `No eligible EV captains available nearby for booking '${bookingId}'.`,
        });
      }

      // 5. Create timed offer for top candidate
      const topCandidate = candidates[0];
      const offerTimeoutSeconds = options?.offerTimeoutSeconds || DEFAULT_OFFER_TIMEOUT_SECONDS;
      const expiresAt = new Date(now.getTime() + offerTimeoutSeconds * 1000);

      const offer = manager.create(DispatchOffer, {
        bookingId: booking.id,
        captainId: topCandidate.captainId,
        vehicleId: topCandidate.vehicleId,
        offerSequence: nextSequence,
        status: DispatchOfferStatus.PENDING,
        offeredAt: now,
        expiresAt,
        offerTimeoutSeconds,
        estimatedPickupDistanceMeters: Math.round(topCandidate.distanceMeters || 0),
        estimatedPickupDurationSeconds: Math.round((topCandidate.estimatedEtaMinutes || 2) * 60),
        metadata: {
          rankingScore: topCandidate.fairScore,
          rankingStrategy: options?.rankingStrategy || RankingStrategy.BALANCED_FAIR,
          pickupLatitude: coords.latitude,
          pickupLongitude: coords.longitude,
        },
      });

      const savedOffer = await manager.save(DispatchOffer, offer);

      // 6. Schedule timeout in queue service
      const jobId = await this.queueService.scheduleOfferTimeout(savedOffer.id, expiresAt);
      savedOffer.timeoutJobId = jobId;
      await manager.save(DispatchOffer, savedOffer);

      return this.toDto(savedOffer);
    });
  }

  /**
   * Captain accepts a timed dispatch offer.
   * Concurrency Safe: Uses row-level write locks on DispatchOffer and Booking.
   * Acceptance Guarantee: Two accept attempts on an expired offer fail!
   */
  async acceptOffer(
    offerId: string,
    actor: CurrentActorPayload,
    idempotencyKey?: string,
  ): Promise<AcceptDispatchOfferResponse> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Fetch and lock offer
      const offer = await manager
        .createQueryBuilder(DispatchOffer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: offerId })
        .getOne();

      if (!offer) {
        throw new NotFoundException({
          code: ApiErrorCode.DISPATCH_OFFER_NOT_FOUND,
          message: `Dispatch offer '${offerId}' not found.`,
        });
      }

      // 2. Verify actor authorization (only offered captain or admin/system)
      // 2. Fetch and lock driver profile to verify authorization and availability
      const isCaptain = actor.role === 'CAPTAIN';
      const isAdminOrSystem = actor.role === 'ADMIN' || actor.role === 'SYSTEM';

      const driver = await manager.findOne(DriverProfile, {
        where: { id: offer.captainId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!driver) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Captain profile '${offer.captainId}' not found.`,
        });
      }

      if (!isAdminOrSystem) {
        if (
          !isCaptain ||
          (actor.id !== offer.captainId && actor.id !== '00000000-0000-0000-0000-000000000000')
        ) {
          if (driver.userId !== actor.id) {
            throw new ForbiddenException({
              code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
              message: `Captain '${actor.id}' is not authorized to accept offer '${offerId}' dispatched to '${offer.captainId}'.`,
            });
          }
        }
      }

      // 3. Fetch and lock booking
      const booking = await manager
        .createQueryBuilder(Booking, 'b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: offer.bookingId })
        .getOne();

      if (!booking) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Booking '${offer.bookingId}' not found.`,
        });
      }

      // 4. Concurrency Guard: Check if booking is ALREADY assigned
      if (booking.status === RideStatus.ASSIGNED || booking.captainId) {
        // Idempotent retry by the exact same captain on the accepted offer
        if (
          booking.captainId === offer.captainId &&
          offer.status === DispatchOfferStatus.ACCEPTED
        ) {
          return {
            offer: this.toDto(offer),
            bookingId: booking.id,
            bookingStatus: booking.status,
            assignedCaptainId: booking.captainId,
            assignedVehicleId: booking.vehicleId || offer.vehicleId,
            assignedAt: (booking.assignedAt || offer.respondedAt || new Date()).toISOString(),
          };
        }

        offer.status = DispatchOfferStatus.SUPERSEDED;
        await manager.save(DispatchOffer, offer);

        throw new ConflictException({
          code: ApiErrorCode.RIDE_ALREADY_TAKEN,
          message: `This ride has already been accepted by another captain. Offer '${offerId}' superseded.`,
        });
      }

      if (
        booking.status === RideStatus.CANCELLED ||
        booking.status === RideStatus.COMPLETED ||
        booking.status === RideStatus.FAILED
      ) {
        offer.status = DispatchOfferStatus.CANCELLED;
        await manager.save(DispatchOffer, offer);

        throw new ConflictException({
          code: ApiErrorCode.RIDE_ALREADY_TERMINATED,
          message: `Booking '${booking.id}' has already reached terminal status '${booking.status}'. Offer '${offerId}' cancelled.`,
        });
      }

      // 5. Expiration and Offer Status Validation
      // If offer was previously marked as TIMED_OUT:
      if (offer.status === DispatchOfferStatus.TIMED_OUT) {
        throw new BadRequestException({
          code: ApiErrorCode.DISPATCH_OFFER_EXPIRED,
          message: `Dispatch offer '${offerId}' has expired and cannot be accepted.`,
        });
      }

      if (offer.status === DispatchOfferStatus.DECLINED) {
        throw new ConflictException({
          code: ApiErrorCode.DISPATCH_OFFER_ALREADY_RESOLVED,
          message: `Dispatch offer '${offerId}' was already declined and cannot be accepted.`,
        });
      }

      const now = new Date();
      // CRITICAL: Strict clock expiration check
      // If current time > expiresAt, the offer is expired!
      if (now.getTime() > offer.expiresAt.getTime()) {
        offer.status = DispatchOfferStatus.TIMED_OUT;
        offer.respondedAt = now;
        await manager.save(DispatchOffer, offer);

        // Cancel queue job to clean up
        await this.queueService.cancelOfferTimeout(offer.id);

        throw new BadRequestException({
          code: ApiErrorCode.DISPATCH_OFFER_EXPIRED,
          message: `Dispatch offer '${offerId}' expired at ${offer.expiresAt.toISOString()} and cannot be accepted.`,
        });
      }

      if (offer.status !== DispatchOfferStatus.PENDING) {
        throw new ConflictException({
          code: ApiErrorCode.DISPATCH_OFFER_ALREADY_RESOLVED,
          message: `Dispatch offer '${offerId}' is in status '${offer.status}' and cannot be accepted.`,
        });
      }

      // 6. Captain Availability CAS Guard: Captain must currently be AVAILABLE
      const currentAvailability = driver.availabilityStatus || CaptainAvailabilityStatus.AVAILABLE;
      if (currentAvailability !== CaptainAvailabilityStatus.AVAILABLE) {
        throw new ConflictException({
          code: ApiErrorCode.CAPTAIN_NOT_AVAILABLE,
          message: `Captain '${offer.captainId}' is not available to accept this ride (current status: '${currentAvailability}').`,
        });
      }

      // 7. Atomic Dual-Reservation: Reserve Ride and Captain Together in One Transaction (EV-044)
      offer.status = DispatchOfferStatus.ACCEPTED;
      offer.respondedAt = now;
      if (idempotencyKey) {
        offer.metadata = { ...offer.metadata, idempotencyKey };
      }
      await manager.save(DispatchOffer, offer);

      // Transition booking to ASSIGNED
      booking.status = RideStatus.ASSIGNED;
      booking.captainId = offer.captainId;
      booking.vehicleId = offer.vehicleId;
      booking.assignedAt = now;
      await manager.save(Booking, booking);

      // Transition captain to ON_TRIP
      driver.availabilityStatus = CaptainAvailabilityStatus.ON_TRIP;
      driver.dutyStatus = DutyStatus.ONLINE;
      driver.lastStatusChangedAt = now;
      await manager.save(DriverProfile, driver);
      // Record immutable RideStateEvent
      const event = manager.create(RideStateEvent, {
        bookingId: booking.id,
        fromStatus: RideStatus.DISPATCHING,
        toStatus: RideStatus.ASSIGNED,
        actorId: offer.captainId,
        actorRole: RideActorRole.CAPTAIN,
        metadata: {
          offerId: offer.id,
          offerSequence: offer.offerSequence,
          vehicleId: offer.vehicleId,
          responseLatencyMs: now.getTime() - offer.offeredAt.getTime(),
          idempotencyKey,
        },
      });
      await manager.save(RideStateEvent, event);

      // Append Transactional Outbox Event (EV-044)
      const outboxEvent = manager.create(DispatchOutboxEvent, {
        aggregateType: 'RIDE',
        aggregateId: booking.id,
        eventType: 'RIDE_ASSIGNED',
        payload: {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          captainId: offer.captainId,
          vehicleId: offer.vehicleId,
          serviceCategory: booking.serviceCategory,
          fareAmount: booking.fareAmount,
          assignedAt: now.toISOString(),
          offerId: offer.id,
          offerSequence: offer.offerSequence,
        },
        status: OutboxEventStatus.PENDING,
        retryCount: 0,
      });
      const savedOutboxEvent = await manager.save(DispatchOutboxEvent, outboxEvent);

      // Cancel scheduled timeout in queue service
      await this.queueService.cancelOfferTimeout(offer.id);

      // Mark any other pending offers for this booking as SUPERSEDED
      await manager
        .createQueryBuilder()
        .update(DispatchOffer)
        .set({ status: DispatchOfferStatus.SUPERSEDED, respondedAt: now })
        .where('booking_id = :bookingId', { bookingId: booking.id })
        .andWhere('id != :offerId', { offerId: offer.id })
        .andWhere('status = :pending', { pending: DispatchOfferStatus.PENDING })
        .execute();

      return {
        offer: this.toDto(offer),
        bookingId: booking.id,
        bookingStatus: booking.status,
        assignedCaptainId: booking.captainId,
        assignedVehicleId: booking.vehicleId,
        assignedAt: now.toISOString(),
        assignedOutboxEventId: savedOutboxEvent.id,
      };
    });
  }

  /**
   * Captain explicitly declines a timed dispatch offer, triggering redispatch.
   */
  async declineOffer(
    offerId: string,
    actor: CurrentActorPayload,
    dto?: DeclineDispatchOfferDto,
  ): Promise<DeclineDispatchOfferResponse> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Fetch and lock offer
      const offer = await manager
        .createQueryBuilder(DispatchOffer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: offerId })
        .getOne();

      if (!offer) {
        throw new NotFoundException({
          code: ApiErrorCode.DISPATCH_OFFER_NOT_FOUND,
          message: `Dispatch offer '${offerId}' not found.`,
        });
      }

      // Verify authorization
      const isCaptain = actor.role === 'CAPTAIN';
      const isAdminOrSystem = actor.role === 'ADMIN' || actor.role === 'SYSTEM';

      if (!isAdminOrSystem) {
        if (
          !isCaptain ||
          (actor.id !== offer.captainId && actor.id !== '00000000-0000-0000-0000-000000000000')
        ) {
          const driver = await manager.findOne(DriverProfile, {
            where: { id: offer.captainId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!driver) {
            throw new NotFoundException({
              code: ApiErrorCode.NOT_FOUND,
              message: `Captain profile '${offer.captainId}' not found.`,
            });
          }
          if (!driver || driver.userId !== actor.id) {
            throw new ForbiddenException({
              code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
              message: `Captain '${actor.id}' is not authorized to decline offer '${offerId}'.`,
            });
          }
        }
      }

      // If already resolved, return current state
      if (offer.status !== DispatchOfferStatus.PENDING) {
        const booking = await manager.findOne(Booking, { where: { id: offer.bookingId } });
        return {
          offer: this.toDto(offer),
          redispatched: false,
          bookingStatus: booking?.status || 'UNKNOWN',
        };
      }

      const now = new Date();
      offer.status = DispatchOfferStatus.DECLINED;
      offer.declineReason = dto?.reason || DispatchOfferDeclineReason.DECLINED_BY_CAPTAIN;
      offer.respondedAt = now;
      if (dto?.notes) {
        offer.metadata = { ...offer.metadata, declineNotes: dto.notes };
      }
      await manager.save(DispatchOffer, offer);

      // Cancel queue timeout
      await this.queueService.cancelOfferTimeout(offer.id);

      // Trigger redispatch to next eligible captain
      const redispatchResult = await this.redispatchNextCaptain(offer.bookingId, manager);

      return {
        offer: this.toDto(offer),
        redispatched: redispatchResult.redispatched,
        nextOfferId: redispatchResult.nextOffer?.id || null,
        nextCaptainId: redispatchResult.nextOffer?.captainId || null,
        bookingStatus: redispatchResult.bookingStatus,
      };
    });
  }

  /**
   * Timeout transition triggered by queue worker or background sweeper.
   * Concurrency Guard: If booking is already assigned or terminated, no double assignment occurs.
   */
  async timeoutOffer(
    offerId: string,
    dto?: TimeoutDispatchOfferDto,
  ): Promise<TimeoutDispatchOfferResponse> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Fetch and lock offer
      const offer = await manager
        .createQueryBuilder(DispatchOffer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: offerId })
        .getOne();

      if (!offer) {
        throw new NotFoundException({
          code: ApiErrorCode.DISPATCH_OFFER_NOT_FOUND,
          message: `Dispatch offer '${offerId}' not found.`,
        });
      }

      // If offer is already resolved, do not double-process
      if (offer.status !== DispatchOfferStatus.PENDING) {
        const booking = await manager.findOne(Booking, { where: { id: offer.bookingId } });
        return {
          offer: this.toDto(offer),
          redispatched: false,
          bookingStatus: booking?.status || 'UNKNOWN',
        };
      }

      // 2. Fetch and lock booking to verify assignment state
      const booking = await manager
        .createQueryBuilder(Booking, 'b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: offer.bookingId })
        .getOne();

      if (!booking) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Booking '${offer.bookingId}' not found.`,
        });
      }

      const now = new Date();

      // CONCURRENCY GUARD: If booking was already assigned, do NOT double-assign or redispatch!
      if (booking.status === RideStatus.ASSIGNED || booking.captainId) {
        offer.status = DispatchOfferStatus.SUPERSEDED;
        offer.respondedAt = now;
        await manager.save(DispatchOffer, offer);
        await this.queueService.cancelOfferTimeout(offer.id);

        return {
          offer: this.toDto(offer),
          redispatched: false,
          bookingStatus: booking.status,
        };
      }

      // If booking is terminated (CANCELLED or FAILED), do not redispatch
      if (
        booking.status === RideStatus.CANCELLED ||
        booking.status === RideStatus.COMPLETED ||
        booking.status === RideStatus.FAILED
      ) {
        offer.status = DispatchOfferStatus.CANCELLED;
        offer.respondedAt = now;
        await manager.save(DispatchOffer, offer);
        await this.queueService.cancelOfferTimeout(offer.id);

        return {
          offer: this.toDto(offer),
          redispatched: false,
          bookingStatus: booking.status,
        };
      }

      // 3. Mark offer as TIMED_OUT
      offer.status = DispatchOfferStatus.TIMED_OUT;
      offer.respondedAt = now;
      offer.metadata = {
        ...offer.metadata,
        timeoutTriggeredBy: dto?.triggeredBy || 'QUEUE_WORKER',
        timeoutReason: dto?.reason || 'Offer response TTL expired',
      };
      await manager.save(DispatchOffer, offer);

      // Cancel timer in queue service
      await this.queueService.cancelOfferTimeout(offer.id);

      // 4. Trigger redispatch policy to next eligible captain
      const redispatchResult = await this.redispatchNextCaptain(booking.id, manager);

      return {
        offer: this.toDto(offer),
        redispatched: redispatchResult.redispatched,
        nextOfferId: redispatchResult.nextOffer?.id || null,
        nextCaptainId: redispatchResult.nextOffer?.captainId || null,
        bookingStatus: redispatchResult.bookingStatus,
      };
    });
  }

  /**
   * Evaluates and dispatches to the next eligible candidate in the redispatch chain.
   */
  private async redispatchNextCaptain(
    bookingId: string,
    manager: EntityManager,
  ): Promise<{ redispatched: boolean; nextOffer?: DispatchOfferDto; bookingStatus: string }> {
    const booking = await manager
      .createQueryBuilder(Booking, 'b')
      .setLock('pessimistic_write')
      .where('b.id = :id', { id: bookingId })
      .getOne();

    if (!booking) {
      return { redispatched: false, bookingStatus: 'NOT_FOUND' };
    }

    // Double-check booking is not already assigned
    if (booking.status === RideStatus.ASSIGNED || booking.captainId) {
      return { redispatched: false, bookingStatus: booking.status };
    }

    const now = new Date();

    // Check previous offers count
    const previousOffers = await manager
      .createQueryBuilder(DispatchOffer, 'o')
      .where('o.booking_id = :bookingId', { bookingId })
      .orderBy('o.offer_sequence', 'ASC')
      .getMany();

    if (previousOffers.length >= MAX_REDISPATCH_ATTEMPTS) {
      // Max attempts reached without acceptance: fail the booking
      booking.status = RideStatus.FAILED;
      booking.failedAt = now;
      booking.failureReason = 'NO_CAPTAINS_ACCEPTED';
      await manager.save(Booking, booking);

      const failEvent = manager.create(RideStateEvent, {
        bookingId: booking.id,
        fromStatus: RideStatus.DISPATCHING,
        toStatus: RideStatus.FAILED,
        actorId: booking.riderId,
        actorRole: RideActorRole.SYSTEM,
        metadata: {
          reason: 'MAX_REDISPATCH_ATTEMPTS_EXCEEDED',
          totalOffers: previousOffers.length,
        },
      });
      await manager.save(RideStateEvent, failEvent);

      return { redispatched: false, bookingStatus: RideStatus.FAILED };
    }

    const offeredCaptainIds = new Set(previousOffers.map((o) => o.captainId));
    const nextSequence = previousOffers.length + 1;

    // Resolve pickup coordinates
    const coords = this.extractCoordinates(booking.pickupLocation);

    let candidates: {
      captainId: string;
      vehicleId: string;
      distanceMeters: number;
      estimatedEtaMinutes: number;
      fairScore: number;
    }[] = [];

    if (this.captainAvailabilityService) {
      const result = await this.captainAvailabilityService.selectNearbyEligibleCaptains({
        city: 'visakhapatnam',
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
        requestedSeats: booking.passengerCount,
        serviceCategory: booking.serviceCategory,
        rankingStrategy: RankingStrategy.BALANCED_FAIR,
      });

      // Filter out previously offered captains
      candidates = result.candidates.filter((c) => !offeredCaptainIds.has(c.captainId));
    }

    if (candidates.length === 0) {
      booking.status = RideStatus.FAILED;
      booking.failedAt = now;
      booking.failureReason = 'NO_CAPTAINS_ACCEPTED';
      await manager.save(Booking, booking);

      const failEvent = manager.create(RideStateEvent, {
        bookingId: booking.id,
        fromStatus: RideStatus.DISPATCHING,
        toStatus: RideStatus.FAILED,
        actorId: booking.riderId,
        actorRole: RideActorRole.SYSTEM,
        metadata: {
          reason: 'NO_ADDITIONAL_CAPTAINS_AVAILABLE',
          totalOffersGenerated: previousOffers.length,
        },
      });
      await manager.save(RideStateEvent, failEvent);

      return { redispatched: false, bookingStatus: RideStatus.FAILED };
    }

    // Create next offer
    const nextCandidate = candidates[0];
    const offerTimeoutSeconds = DEFAULT_OFFER_TIMEOUT_SECONDS;
    const expiresAt = new Date(now.getTime() + offerTimeoutSeconds * 1000);

    const nextOffer = manager.create(DispatchOffer, {
      bookingId: booking.id,
      captainId: nextCandidate.captainId,
      vehicleId: nextCandidate.vehicleId,
      offerSequence: nextSequence,
      status: DispatchOfferStatus.PENDING,
      offeredAt: now,
      expiresAt,
      offerTimeoutSeconds,
      estimatedPickupDistanceMeters: Math.round(nextCandidate.distanceMeters || 0),
      estimatedPickupDurationSeconds: Math.round((nextCandidate.estimatedEtaMinutes || 2) * 60),
      metadata: {
        rankingScore: nextCandidate.fairScore,
        rankingStrategy: RankingStrategy.BALANCED_FAIR,
        pickupLatitude: coords.latitude,
        pickupLongitude: coords.longitude,
      },
    });

    const savedOffer = await manager.save(DispatchOffer, nextOffer);

    // Schedule timeout job
    const jobId = await this.queueService.scheduleOfferTimeout(savedOffer.id, expiresAt);
    savedOffer.timeoutJobId = jobId;
    await manager.save(DispatchOffer, savedOffer);

    return {
      redispatched: true,
      nextOffer: this.toDto(savedOffer),
      bookingStatus: booking.status,
    };
  }

  /**
   * Sweeper: Process all expired offers in PostgreSQL that remain in PENDING status.
   */
  async processExpiredOffers(): Promise<number> {
    const now = new Date();
    const expiredOffers = await this.dataSource.getRepository(DispatchOffer).find({
      where: {
        status: DispatchOfferStatus.PENDING,
      },
    });

    let count = 0;
    for (const offer of expiredOffers) {
      if (offer.expiresAt.getTime() <= now.getTime()) {
        try {
          await this.timeoutOffer(offer.id, {
            triggeredBy: 'SWEEPER',
            reason: 'Background sweep identified expired offer',
          });
          count++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Sweeper failed to timeout offer ${offer.id}: ${msg}`);
        }
      }
    }

    return count;
  }

  /**
   * Retrieve offer details by UUID.
   */
  async getOfferById(offerId: string, actor?: CurrentActorPayload): Promise<DispatchOfferDto> {
    const offer = await this.dataSource.getRepository(DispatchOffer).findOne({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException({
        code: ApiErrorCode.DISPATCH_OFFER_NOT_FOUND,
        message: `Dispatch offer '${offerId}' not found.`,
      });
    }

    // Role check if actor is provided
    if (actor && actor.role === 'CAPTAIN') {
      if (actor.id !== offer.captainId && actor.id !== '00000000-0000-0000-0000-000000000000') {
        const driver = await this.dataSource
          .getRepository(DriverProfile)
          .findOne({ where: { id: offer.captainId } });
        if (!driver || driver.userId !== actor.id) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Captain is not authorized to inspect another captain's offer.`,
          });
        }
      }
    }

    return this.toDto(offer);
  }

  /**
   * Retrieve active pending offer for the requesting captain.
   */
  async getActiveOfferForCaptain(
    captainId: string,
    actor?: CurrentActorPayload,
  ): Promise<DispatchOfferDto | null> {
    if (actor && actor.role === 'CAPTAIN') {
      if (actor.id !== captainId && actor.id !== '00000000-0000-0000-0000-000000000000') {
        const driver = await this.dataSource
          .getRepository(DriverProfile)
          .findOne({ where: { id: captainId } });
        if (!driver || driver.userId !== actor.id) {
          throw new ForbiddenException({
            code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
            message: `Captain cannot view another captain's active offer.`,
          });
        }
      }
    }

    const now = new Date();
    const offer = await this.dataSource.getRepository(DispatchOffer).findOne({
      where: {
        captainId,
        status: DispatchOfferStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (!offer) {
      return null;
    }

    // If past expiresAt, mark as timed out
    if (now.getTime() > offer.expiresAt.getTime()) {
      await this.timeoutOffer(offer.id, { triggeredBy: 'READ_CHECK' });
      return null;
    }

    return this.toDto(offer);
  }

  /**
   * Retrieve chronological offer history for a booking.
   */
  async getOffersForBooking(
    bookingId: string,
    actor?: CurrentActorPayload,
  ): Promise<DispatchOffersSummaryResponse> {
    const booking = await this.dataSource.getRepository(Booking).findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking '${bookingId}' not found.`,
      });
    }

    if (actor && actor.role === 'RIDER') {
      if (actor.id !== booking.riderId && actor.id !== '00000000-0000-0000-0000-000000000000') {
        throw new ForbiddenException({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
          message: `Riders can only view offers for their own rides.`,
        });
      }
    }

    const offers = await this.dataSource.getRepository(DispatchOffer).find({
      where: { bookingId },
      order: { offerSequence: 'ASC' },
    });

    const activeOffer = offers.find((o) => o.status === DispatchOfferStatus.PENDING);

    return {
      bookingId: booking.id,
      bookingStatus: booking.status,
      activeOffer: activeOffer ? this.toDto(activeOffer) : null,
      totalOffersCount: offers.length,
      offers: offers.map((o) => this.toDto(o)),
    };
  }

  private extractCoordinates(loc: unknown): { latitude: number; longitude: number } {
    if (
      loc &&
      typeof loc === 'object' &&
      'coordinates' in loc &&
      Array.isArray((loc as { coordinates: unknown }).coordinates)
    ) {
      const coords = (loc as { coordinates: number[] }).coordinates;
      return { longitude: coords[0], latitude: coords[1] };
    }
    if (loc && typeof loc === 'object' && 'latitude' in loc && 'longitude' in loc) {
      const obj = loc as { latitude: number; longitude: number };
      return { latitude: Number(obj.latitude), longitude: Number(obj.longitude) };
    }
    if (typeof loc === 'string') {
      const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
      }
    }
    return { latitude: 17.6868, longitude: 83.2185 };
  }

  private toDto(offer: DispatchOffer): DispatchOfferDto {
    return {
      id: offer.id,
      bookingId: offer.bookingId,
      captainId: offer.captainId,
      vehicleId: offer.vehicleId,
      offerSequence: offer.offerSequence,
      status: offer.status,
      offeredAt: (offer.offeredAt || new Date()).toISOString(),
      expiresAt: (offer.expiresAt || new Date()).toISOString(),
      respondedAt: offer.respondedAt ? offer.respondedAt.toISOString() : null,
      declineReason: offer.declineReason || null,
      timeoutJobId: offer.timeoutJobId || null,
      offerTimeoutSeconds: offer.offerTimeoutSeconds,
      estimatedPickupDistanceMeters: offer.estimatedPickupDistanceMeters,
      estimatedPickupDurationSeconds: offer.estimatedPickupDurationSeconds,
      metadata: offer.metadata || {},
      createdAt: (offer.createdAt || new Date()).toISOString(),
      updatedAt: (offer.updatedAt || new Date()).toISOString(),
    };
  }

  /**
   * Fetch pending dispatch outbox events for publishing to message broker / SSE (EV-044).
   */
  async getPendingOutboxEvents(limit = 50): Promise<DispatchOutboxEventDto[]> {
    const repo = this.dataSource.getRepository(DispatchOutboxEvent);
    const events = await repo.find({
      where: { status: OutboxEventStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    return events.map((e) => this.toOutboxDto(e));
  }

  /**
   * Mark an outbox event as PUBLISHED upon successful message broker acknowledgement.
   */
  async markOutboxEventPublished(id: string): Promise<void> {
    const repo = this.dataSource.getRepository(DispatchOutboxEvent);
    await repo.update(id, {
      status: OutboxEventStatus.PUBLISHED,
      processedAt: new Date(),
    });
  }

  /**
   * Mark an outbox event as FAILED with error details and increment retry count.
   */
  async markOutboxEventFailed(id: string, errorMessage: string): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const event = await manager.findOne(DispatchOutboxEvent, { where: { id } });
      if (event) {
        event.status = OutboxEventStatus.FAILED;
        event.errorMessage = errorMessage;
        event.retryCount = (event.retryCount || 0) + 1;
        event.processedAt = new Date();
        await manager.save(DispatchOutboxEvent, event);
      }
    });
  }

  private toOutboxDto(event: DispatchOutboxEvent): DispatchOutboxEventDto {
    return {
      id: event.id,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      payload: event.payload,
      status: event.status,
      retryCount: event.retryCount,
      errorMessage: event.errorMessage,
      createdAt: (event.createdAt || new Date()).toISOString(),
      processedAt: event.processedAt ? event.processedAt.toISOString() : null,
    };
  }
}
