import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  ApiErrorCode,
  DispatchOfferStatus,
  RideStatus,
  CaptainAvailabilityStatus,
  DutyStatus,
  OutboxEventStatus,
  AcceptDispatchOfferResponse,
} from '@ecoride/contracts';
import { DispatchOffersService } from '../src/modules/dispatch/dispatch-offers.service';
import { DispatchOffersQueueService } from '../src/modules/dispatch/dispatch-offers-queue.service';
import { DispatchOffer } from '../src/database/entities/dispatch-offer.entity';
import { Booking } from '../src/database/entities/booking.entity';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';
import { RideStateEvent } from '../src/database/entities/ride-state-event.entity';
import { DispatchOutboxEvent } from '../src/database/entities/dispatch-outbox-event.entity';

describe('DispatchOffersService — Atomic First-Winner Assignment & Outbox Event (EV-044)', () => {
  let service: DispatchOffersService;
  let mockQueueService: Partial<DispatchOffersQueueService>;

  const bookingId = 'b1000000-0000-4000-8000-000000000001';
  const riderId = 'r1000000-0000-4000-8000-000000000001';

  let currentBooking: Booking;
  let driverProfilesMap: Map<string, DriverProfile>;
  let dispatchOffersMap: Map<string, DispatchOffer>;
  let outboxEvents: DispatchOutboxEvent[];
  let rideStateEvents: RideStateEvent[];

  function createTestBooking(overrides: Partial<Booking> = {}): Booking {
    const booking = new Booking();
    booking.id = bookingId;
    booking.bookingCode = 'ECO-VIZ-260311-888';
    booking.riderId = riderId;
    booking.status = RideStatus.DISPATCHING;
    booking.serviceCategory = 'CITY_COMMUTE_4W';
    booking.passengerCount = 1;
    booking.fareAmount = 240.0;
    booking.pickupLocation = { type: 'Point', coordinates: [83.2185, 17.6868] };
    booking.dropoffLocation = { type: 'Point', coordinates: [83.3185, 17.7268] };
    booking.requestedAt = new Date();
    booking.dispatchingAt = new Date();
    booking.captainId = undefined;
    booking.vehicleId = undefined;
    booking.assignedAt = null;
    booking.createdAt = new Date();
    booking.updatedAt = new Date();
    Object.assign(booking, overrides);
    return booking;
  }

  function createTestDriver(index: number, overrides: Partial<DriverProfile> = {}): DriverProfile {
    const padded = String(index).padStart(2, '0');
    const driver = new DriverProfile();
    driver.id = `c1000000-0000-4000-8000-0000000000${padded}`;
    driver.userId = `u1000000-0000-4000-8000-0000000000${padded}`;
    driver.licenseNumber = `AP-31-EV-2026-${padded}`;
    driver.dutyStatus = DutyStatus.ONLINE;
    driver.availabilityStatus = CaptainAvailabilityStatus.AVAILABLE;
    driver.batterySocPercent = 85;
    driver.lastStatusChangedAt = new Date();
    Object.assign(driver, overrides);
    return driver;
  }

  function createTestOffer(index: number, driver: DriverProfile): DispatchOffer {
    const padded = String(index).padStart(2, '0');
    const offer = new DispatchOffer();
    offer.id = `off-10000000-0000-4000-8000-0000000000${padded}`;
    offer.bookingId = bookingId;
    offer.captainId = driver.id;
    offer.vehicleId = `v1000000-0000-4000-8000-0000000000${padded}`;
    offer.offerSequence = index;
    offer.status = DispatchOfferStatus.PENDING;
    offer.offeredAt = new Date();
    offer.expiresAt = new Date(Date.now() + 30_000); // 30s TTL
    offer.respondedAt = null;
    offer.declineReason = null;
    offer.timeoutJobId = `job_timeout_${offer.id}`;
    offer.offerTimeoutSeconds = 30;
    offer.estimatedPickupDistanceMeters = 500 + index * 50;
    offer.estimatedPickupDurationSeconds = 120 + index * 10;
    offer.metadata = { rankingIndex: index };
    offer.createdAt = new Date();
    offer.updatedAt = new Date();
    return offer;
  }

  beforeEach(async () => {
    currentBooking = createTestBooking();
    driverProfilesMap = new Map();
    dispatchOffersMap = new Map();
    outboxEvents = [];
    rideStateEvents = [];

    mockQueueService = {
      cancelOfferTimeout: jest.fn().mockResolvedValue(true),
      scheduleOfferTimeout: jest.fn().mockResolvedValue('job-123'),
      registerTimeoutHandler: jest.fn(),
    };

    // Serialize database transactions to simulate PostgreSQL row-level exclusive locks on booking & driver
    let lockQueue: Promise<unknown> = Promise.resolve();

    const mockEntityManager = {
      createQueryBuilder: jest.fn().mockImplementation((entityClass?: unknown, alias?: string) => {
        let whereParams: Record<string, unknown> = {};
        let updateValues: Record<string, unknown> | undefined = undefined;

        const qb = {
          setLock: jest.fn().mockReturnThis(),
          where: jest
            .fn()
            .mockImplementation((_condition: string, params: Record<string, unknown>) => {
              whereParams = { ...whereParams, ...params };
              return qb;
            }),
          andWhere: jest
            .fn()
            .mockImplementation((_condition: string, params: Record<string, unknown>) => {
              whereParams = { ...whereParams, ...params };
              return qb;
            }),
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockImplementation((values: Record<string, unknown>) => {
            updateValues = values;
            return qb;
          }),
          execute: jest.fn().mockImplementation(async () => {
            if (entityClass === DispatchOffer && updateValues) {
              const bookingIdParam = whereParams.bookingId;
              const notOfferIdParam = whereParams.offerId;
              let count = 0;
              for (const [id, off] of dispatchOffersMap.entries()) {
                if (
                  off.bookingId === bookingIdParam &&
                  id !== notOfferIdParam &&
                  off.status === DispatchOfferStatus.PENDING
                ) {
                  off.status = (updateValues.status as string) || DispatchOfferStatus.SUPERSEDED;
                  off.respondedAt = (updateValues.respondedAt as Date) || new Date();
                  count++;
                }
              }
              return { affected: count };
            }
            return { affected: 1 };
          }),
          getOne: jest.fn().mockImplementation(async () => {
            if (entityClass === Booking || alias === 'b') {
              if (whereParams.id === currentBooking.id) {
                return currentBooking;
              }
              return null;
            }
            if (entityClass === DispatchOffer || alias === 'o') {
              if (whereParams.id) {
                return dispatchOffersMap.get(whereParams.id as string) || null;
              }
              return null;
            }
            if (entityClass === DriverProfile || alias === 'dp') {
              if (whereParams.id) {
                return driverProfilesMap.get(whereParams.id as string) || null;
              }
              return null;
            }
            return null;
          }),
        };
        return qb;
      }),

      findOne: jest
        .fn()
        .mockImplementation(
          async (entityClass: unknown, options: { where: Record<string, unknown> }) => {
            if (entityClass === DriverProfile) {
              return driverProfilesMap.get(options.where.id as string) || null;
            }
            if (entityClass === Booking) {
              if (options.where.id === currentBooking.id) {
                return currentBooking;
              }
              return null;
            }
            if (entityClass === DispatchOffer) {
              return dispatchOffersMap.get(options.where.id as string) || null;
            }
            if (entityClass === DispatchOutboxEvent) {
              return outboxEvents.find((e) => e.id === options.where.id) || null;
            }
            return null;
          },
        ),

      find: jest
        .fn()
        .mockImplementation(
          async (entityClass: unknown, options?: { where?: Record<string, unknown> }) => {
            if (entityClass === DispatchOutboxEvent) {
              const status = options?.where?.status;
              if (status) {
                return outboxEvents.filter((e) => e.status === status);
              }
              return [...outboxEvents];
            }
            return [];
          },
        ),

      create: jest.fn().mockImplementation((entityClass: unknown, dto: Record<string, unknown>) => {
        if (entityClass === DispatchOutboxEvent) {
          const outbox = new DispatchOutboxEvent();
          outbox.id = `outbox-uuid-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          outbox.createdAt = new Date();
          Object.assign(outbox, dto);
          return outbox;
        }
        if (entityClass === RideStateEvent) {
          const rse = new RideStateEvent();
          rse.id = `rse-uuid-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          rse.createdAt = new Date();
          Object.assign(rse, dto);
          return rse;
        }
        return { id: `mock-${Date.now()}`, ...dto };
      }),

      save: jest
        .fn()
        .mockImplementation(async (_entityClass: unknown, entityOrInstance: unknown) => {
          const target = (entityOrInstance || _entityClass) as Record<string, unknown>;
          if (target instanceof Booking || ('bookingCode' in target && 'status' in target)) {
            Object.assign(currentBooking, target);
            return currentBooking;
          }
          if (
            target instanceof DriverProfile ||
            ('licenseNumber' in target && 'availabilityStatus' in target)
          ) {
            const id = target.id as string;
            if (driverProfilesMap.has(id)) {
              const existing = driverProfilesMap.get(id)!;
              Object.assign(existing, target);
              return existing;
            }
            return target;
          }
          if (
            target instanceof DispatchOffer ||
            ('bookingId' in target && 'offerSequence' in target)
          ) {
            const id = target.id as string;
            dispatchOffersMap.set(id, target as unknown as DispatchOffer);
            return target;
          }
          if (
            target instanceof DispatchOutboxEvent ||
            ('aggregateType' in target && 'eventType' in target)
          ) {
            const outbox = target as unknown as DispatchOutboxEvent;
            if (!outbox.id) {
              outbox.id = `outbox-uuid-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
            }
            outboxEvents.push(outbox);
            return outbox;
          }
          if (
            target instanceof RideStateEvent ||
            ('fromStatus' in target && 'toStatus' in target)
          ) {
            rideStateEvents.push(target as unknown as RideStateEvent);
            return target;
          }
          return target;
        }),
    };

    const mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (callback: (em: typeof mockEntityManager) => Promise<unknown>) => {
            // Enqueue transaction to execute serially, simulating PostgreSQL row-level locks on the booking row
            const nextInQueue = lockQueue.then(async () => {
              return callback(mockEntityManager);
            });
            lockQueue = nextInQueue.catch(() => {});
            return nextInQueue;
          },
        ),
      getRepository: jest.fn().mockImplementation((entityClass: unknown) => {
        if (entityClass === DispatchOutboxEvent) {
          return {
            find: jest
              .fn()
              .mockImplementation(async (options?: { where?: Record<string, unknown> }) => {
                const status = options?.where?.status;
                if (status) {
                  return outboxEvents.filter((e) => e.status === status);
                }
                return [...outboxEvents];
              }),
            update: jest
              .fn()
              .mockImplementation(async (id: string, values: Record<string, unknown>) => {
                const event = outboxEvents.find((e) => e.id === id);
                if (event) {
                  Object.assign(event, values);
                }
                return { affected: 1 };
              }),
          };
        }
        return {};
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchOffersService,
        { provide: DispatchOffersQueueService, useValue: mockQueueService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<DispatchOffersService>(DispatchOffersService);
  });

  describe('ACCEPTANCE CRITERIA: 50 Competing Accept Requests for One Ride', () => {
    it('executes 50 parallel accept requests: proves exactly ONE winner and ZERO duplicated captain reservation', async () => {
      const TOTAL_COMPETING_CAPTAINS = 50;
      const offers: DispatchOffer[] = [];

      // 1. Setup 50 distinct captains and 50 competing pending offers
      for (let i = 1; i <= TOTAL_COMPETING_CAPTAINS; i++) {
        const driver = createTestDriver(i);
        driverProfilesMap.set(driver.id, driver);

        const offer = createTestOffer(i, driver);
        dispatchOffersMap.set(offer.id, offer);
        offers.push(offer);
      }

      expect(driverProfilesMap.size).toBe(50);
      expect(dispatchOffersMap.size).toBe(50);

      // Verify initial state: All 50 captains are AVAILABLE
      for (const driver of driverProfilesMap.values()) {
        expect(driver.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      }
      // Booking is unassigned
      expect(currentBooking.status).toBe(RideStatus.DISPATCHING);
      expect(currentBooking.captainId).toBeUndefined();

      // 2. Fire 50 concurrent accept requests simultaneously using Promise.allSettled
      const requests = offers.map((offer) =>
        service.acceptOffer(
          offer.id,
          { id: offer.captainId, role: 'CAPTAIN', scopes: [] },
          `idemp-key-${offer.id}`,
        ),
      );

      const results = await Promise.allSettled(requests);

      // 3. Analyze Concurrency Results
      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<AcceptDispatchOfferResponse> => r.status === 'fulfilled',
      );
      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

      // PROOF 1: Exactly 1 Winner among the 50 competing captains
      expect(fulfilled).toHaveLength(1);
      const winnerResult = fulfilled[0].value;
      const winnerCaptainId = winnerResult.assignedCaptainId;
      const winnerOfferId = winnerResult.offer.id;

      expect(winnerResult.bookingStatus).toBe(RideStatus.ASSIGNED);
      expect(winnerResult.assignedCaptainId).toBeDefined();
      expect(winnerResult.assignedOutboxEventId).toBeDefined();

      // PROOF 2: Exactly 49 Rejected with distinct RIDE_ALREADY_TAKEN error
      expect(rejected).toHaveLength(TOTAL_COMPETING_CAPTAINS - 1); // 49
      for (const rej of rejected) {
        expect(rej.reason).toBeInstanceOf(ConflictException);
        const errResponse = (rej.reason as ConflictException).getResponse() as Record<
          string,
          unknown
        >;
        expect(errResponse.code).toBe(ApiErrorCode.RIDE_ALREADY_TAKEN);
        expect(String(errResponse.message)).toContain(
          'This ride has already been accepted by another captain',
        );
      }

      // PROOF 3: Authoritative Database State — Booking assigned strictly to winner
      expect(currentBooking.status).toBe(RideStatus.ASSIGNED);
      expect(currentBooking.captainId).toBe(winnerCaptainId);
      expect(currentBooking.assignedAt).toBeInstanceOf(Date);

      // PROOF 4: ZERO DUPLICATED CAPTAIN RESERVATIONS!
      // Exactly 1 captain is transitioned to ON_TRIP
      const onTripCaptains = Array.from(driverProfilesMap.values()).filter(
        (d) => d.availabilityStatus === CaptainAvailabilityStatus.ON_TRIP,
      );
      expect(onTripCaptains).toHaveLength(1);
      expect(onTripCaptains[0].id).toBe(winnerCaptainId);

      // Exactly 49 captains remain strictly AVAILABLE (not reserved or locked out)
      const availableCaptains = Array.from(driverProfilesMap.values()).filter(
        (d) => d.availabilityStatus === CaptainAvailabilityStatus.AVAILABLE,
      );
      expect(availableCaptains).toHaveLength(TOTAL_COMPETING_CAPTAINS - 1); // 49

      // PROOF 5: Offers State in Database
      // The winning offer is ACCEPTED
      const winningOfferInDb = dispatchOffersMap.get(winnerOfferId)!;
      expect(winningOfferInDb.status).toBe(DispatchOfferStatus.ACCEPTED);
      expect(winningOfferInDb.respondedAt).toBeInstanceOf(Date);

      // All competing offers are SUPERSEDED
      const supersededOffers = Array.from(dispatchOffersMap.values()).filter(
        (o) => o.status === DispatchOfferStatus.SUPERSEDED,
      );
      expect(supersededOffers).toHaveLength(TOTAL_COMPETING_CAPTAINS - 1); // 49

      // PROOF 6: Transactional Outbox Pattern — Exactly ONE outbox event appended atomically
      expect(outboxEvents).toHaveLength(1);
      const assignmentOutboxEvent = outboxEvents[0];
      expect(assignmentOutboxEvent.aggregateType).toBe('RIDE');
      expect(assignmentOutboxEvent.aggregateId).toBe(currentBooking.id);
      expect(assignmentOutboxEvent.eventType).toBe('RIDE_ASSIGNED');
      expect(assignmentOutboxEvent.status).toBe(OutboxEventStatus.PENDING);
      expect(assignmentOutboxEvent.retryCount).toBe(0);

      const payload = assignmentOutboxEvent.payload as Record<string, unknown>;
      expect(payload.bookingId).toBe(currentBooking.id);
      expect(payload.bookingCode).toBe(currentBooking.bookingCode);
      expect(payload.captainId).toBe(winnerCaptainId);
      expect(payload.offerId).toBe(winnerOfferId);
      expect(payload.assignedAt).toBeDefined();

      // PROOF 7: Scheduled Queue Timeout for the winner offer was cancelled
      expect(mockQueueService.cancelOfferTimeout).toHaveBeenCalledWith(winnerOfferId);
    });
  });

  describe('Safeguards, Edge Cases, and Idempotency', () => {
    it('allows the winning captain to retry accept idempotently with HTTP 200 without duplicating reservation', async () => {
      const driver = createTestDriver(1);
      driverProfilesMap.set(driver.id, driver);
      const offer = createTestOffer(1, driver);
      dispatchOffersMap.set(offer.id, offer);

      // First accept attempt succeeds
      const firstResult = await service.acceptOffer(
        offer.id,
        { id: driver.id, role: 'CAPTAIN', scopes: [] },
        'idemp-key-winner',
      );
      expect(firstResult.bookingStatus).toBe(RideStatus.ASSIGNED);
      expect(outboxEvents).toHaveLength(1);

      // Second identical accept by the winning captain (e.g. mobile client retry / timeout reconnect)
      const secondResult = await service.acceptOffer(
        offer.id,
        { id: driver.id, role: 'CAPTAIN', scopes: [] },
        'idemp-key-winner',
      );

      expect(secondResult.bookingStatus).toBe(RideStatus.ASSIGNED);
      expect(secondResult.assignedCaptainId).toBe(driver.id);
      // No duplicate outbox event appended
      expect(outboxEvents).toHaveLength(1);
      // Driver remains ON_TRIP, not double-assigned
      expect(driver.availabilityStatus).toBe(CaptainAvailabilityStatus.ON_TRIP);
    });

    it('refuses accept if captain is NOT AVAILABLE (e.g. CHARGING or OFFLINE) and protects ride assignment', async () => {
      const chargingDriver = createTestDriver(1, {
        availabilityStatus: CaptainAvailabilityStatus.CHARGING,
      });
      driverProfilesMap.set(chargingDriver.id, chargingDriver);
      const offer = createTestOffer(1, chargingDriver);
      dispatchOffersMap.set(offer.id, offer);

      await expect(
        service.acceptOffer(offer.id, { id: chargingDriver.id, role: 'CAPTAIN', scopes: [] }),
      ).rejects.toThrow(ConflictException);

      try {
        await service.acceptOffer(offer.id, { id: chargingDriver.id, role: 'CAPTAIN', scopes: [] });
      } catch (err: unknown) {
        const error = err as ConflictException;
        const res = error.getResponse() as Record<string, unknown>;
        expect(res.code).toBe(ApiErrorCode.CAPTAIN_NOT_AVAILABLE);
        expect(String(res.message)).toContain('is not available to accept this ride');
      }

      // Ride was NOT assigned
      expect(currentBooking.status).toBe(RideStatus.DISPATCHING);
      expect(currentBooking.captainId).toBeUndefined();
      // Zero outbox events created
      expect(outboxEvents).toHaveLength(0);
    });

    it('refuses accept if ride booking reached terminal status CANCELLED', async () => {
      currentBooking.status = RideStatus.CANCELLED;
      const driver = createTestDriver(1);
      driverProfilesMap.set(driver.id, driver);
      const offer = createTestOffer(1, driver);
      dispatchOffersMap.set(offer.id, offer);

      await expect(
        service.acceptOffer(offer.id, { id: driver.id, role: 'CAPTAIN', scopes: [] }),
      ).rejects.toThrow(ConflictException);

      try {
        await service.acceptOffer(offer.id, { id: driver.id, role: 'CAPTAIN', scopes: [] });
      } catch (err: unknown) {
        const res = (err as ConflictException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(ApiErrorCode.RIDE_ALREADY_TERMINATED);
      }

      // Offer marked CANCELLED
      expect(offer.status).toBe(DispatchOfferStatus.CANCELLED);
      // Captain remains AVAILABLE
      expect(driver.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      // Zero outbox events
      expect(outboxEvents).toHaveLength(0);
    });

    it('refuses accept if offer has expired past its TTL and marks status as TIMED_OUT', async () => {
      const driver = createTestDriver(1);
      driverProfilesMap.set(driver.id, driver);
      const offer = createTestOffer(1, driver);
      offer.expiresAt = new Date(Date.now() - 5000); // Expired 5 seconds ago
      dispatchOffersMap.set(offer.id, offer);

      await expect(
        service.acceptOffer(offer.id, { id: driver.id, role: 'CAPTAIN', scopes: [] }),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.acceptOffer(offer.id, { id: driver.id, role: 'CAPTAIN', scopes: [] });
      } catch (err: unknown) {
        const res = (err as BadRequestException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(ApiErrorCode.DISPATCH_OFFER_EXPIRED);
      }

      expect(offer.status).toBe(DispatchOfferStatus.TIMED_OUT);
      expect(currentBooking.status).toBe(RideStatus.DISPATCHING);
      expect(driver.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      expect(outboxEvents).toHaveLength(0);
    });

    it('forbids an unauthorized captain from accepting an offer dispatched to another captain', async () => {
      const driver1 = createTestDriver(1);
      const driver2 = createTestDriver(2);
      driverProfilesMap.set(driver1.id, driver1);
      driverProfilesMap.set(driver2.id, driver2);

      const offerForDriver1 = createTestOffer(1, driver1);
      dispatchOffersMap.set(offerForDriver1.id, offerForDriver1);

      // Captain 2 attempts to accept Captain 1's offer
      await expect(
        service.acceptOffer(offerForDriver1.id, {
          id: driver2.userId,
          role: 'CAPTAIN',
          scopes: [],
        }),
      ).rejects.toThrow(ForbiddenException);

      try {
        await service.acceptOffer(offerForDriver1.id, {
          id: driver2.userId,
          role: 'CAPTAIN',
          scopes: [],
        });
      } catch (err: unknown) {
        const res = (err as ForbiddenException).getResponse() as Record<string, unknown>;
        expect(res.code).toBe(ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR);
      }

      // Ride remains unassigned
      expect(currentBooking.status).toBe(RideStatus.DISPATCHING);
      expect(outboxEvents).toHaveLength(0);
    });
  });

  describe('Transactional Outbox Lifecycle Management', () => {
    it('manages outbox events: fetch pending, mark published, and mark failed with retry count', async () => {
      const driver = createTestDriver(1);
      driverProfilesMap.set(driver.id, driver);
      const offer = createTestOffer(1, driver);
      dispatchOffersMap.set(offer.id, offer);

      // Accept offer to produce outbox event
      const res = await service.acceptOffer(offer.id, {
        id: driver.id,
        role: 'CAPTAIN',
        scopes: [],
      });

      // 1. Fetch pending events
      const pendingEvents = await service.getPendingOutboxEvents(10);
      expect(pendingEvents).toHaveLength(1);
      expect(pendingEvents[0].id).toBe(res.assignedOutboxEventId);
      expect(pendingEvents[0].status).toBe(OutboxEventStatus.PENDING);

      // 2. Mark published
      await service.markOutboxEventPublished(res.assignedOutboxEventId!);
      expect(outboxEvents[0].status).toBe(OutboxEventStatus.PUBLISHED);
      expect(outboxEvents[0].processedAt).toBeInstanceOf(Date);

      // 3. Mark failed on an event
      await service.markOutboxEventFailed(res.assignedOutboxEventId!, 'Kafka broker unreachable');
      expect(outboxEvents[0].status).toBe(OutboxEventStatus.FAILED);
      expect(outboxEvents[0].errorMessage).toBe('Kafka broker unreachable');
      expect(outboxEvents[0].retryCount).toBe(1);
    });
  });
});
