import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  ApiErrorCode,
  DispatchOfferStatus,
  DispatchOfferDeclineReason,
  RideStatus,
  RankingStrategy,
} from '@ecoride/contracts';
import { DispatchOffersService } from '../src/modules/dispatch/dispatch-offers.service';
import { DispatchOffersQueueService } from '../src/modules/dispatch/dispatch-offers-queue.service';
import { CaptainAvailabilityService } from '../src/modules/compliance/captain-availability.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { DispatchOffer } from '../src/database/entities/dispatch-offer.entity';
import { Booking } from '../src/database/entities/booking.entity';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';

describe('DispatchOffersService — Expiring Dispatch Offers & Concurrency Protection (EV-043)', () => {
  let service: DispatchOffersService;
  let queueService: DispatchOffersQueueService;
  let mockCaptainAvailabilityService: Partial<CaptainAvailabilityService>;
  let mockRedisService: Partial<RedisService>;
  let mockRedisClient: {
    status: string;
    zadd: jest.Mock;
    zrem: jest.Mock;
    zrangebyscore: jest.Mock;
  };
  let mockEntityManager: Record<string, jest.Mock>;
  let mockDataSource: {
    transaction: jest.Mock;
    getRepository: jest.Mock;
  };

  const bookingId = 'b0000000-0000-4000-8000-000000000001';
  const riderId = 'r0000000-0000-4000-8000-000000000001';
  const captain1Id = 'c0000001-0000-4000-8000-000000000001';
  const captain1UserId = 'u0000001-0000-4000-8000-000000000001';
  const vehicle1Id = 'v0000001-0000-4000-8000-000000000001';

  const captain2Id = 'c0000002-0000-4000-8000-000000000002';
  const captain2UserId = 'u0000002-0000-4000-8000-000000000002';
  const vehicle2Id = 'v0000002-0000-4000-8000-000000000002';

  const captain3Id = 'c0000003-0000-4000-8000-000000000003';
  const vehicle3Id = 'v0000003-0000-4000-8000-000000000003';

  let currentBooking: Booking;
  let existingOffers: DispatchOffer[];

  function createTestBooking(overrides: Partial<Booking> = {}): Booking {
    const booking = new Booking();
    booking.id = bookingId;
    booking.bookingCode = 'ECO-VIS-260311-001';
    booking.riderId = riderId;
    booking.status = RideStatus.REQUESTED;
    booking.serviceCategory = 'CITY_COMMUTE_2W';
    booking.passengerCount = 1;
    booking.fareAmount = 85.0;
    booking.pickupLocation = { type: 'Point', coordinates: [83.2185, 17.6868] };
    booking.dropoffLocation = { type: 'Point', coordinates: [83.3185, 17.7268] };
    booking.requestedAt = new Date();
    booking.createdAt = new Date();
    booking.updatedAt = new Date();
    Object.assign(booking, overrides);
    return booking;
  }

  function createTestOffer(overrides: Partial<DispatchOffer> = {}): DispatchOffer {
    const offer = new DispatchOffer();
    offer.id = 'off-00000001-0000-4000-8000-000000000001';
    offer.bookingId = bookingId;
    offer.captainId = captain1Id;
    offer.vehicleId = vehicle1Id;
    offer.offerSequence = 1;
    offer.status = DispatchOfferStatus.PENDING;
    offer.offeredAt = new Date();
    offer.expiresAt = new Date(Date.now() + 15_000); // 15 seconds from now
    offer.respondedAt = null;
    offer.declineReason = null;
    offer.timeoutJobId = `job_offer_timeout_${offer.id}`;
    offer.offerTimeoutSeconds = 15;
    offer.estimatedPickupDistanceMeters = 650;
    offer.estimatedPickupDurationSeconds = 120;
    offer.metadata = {};
    offer.createdAt = new Date();
    offer.updatedAt = new Date();
    Object.assign(offer, overrides);
    return offer;
  }

  beforeEach(async () => {
    currentBooking = createTestBooking();
    existingOffers = [];

    mockRedisClient = {
      status: 'ready',
      zadd: jest.fn().mockResolvedValue(1),
      zrem: jest.fn().mockResolvedValue(1),
      zrangebyscore: jest.fn().mockResolvedValue([]),
    };

    mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient as unknown as import('ioredis').default),
    };

    mockCaptainAvailabilityService = {
      selectNearbyEligibleCaptains: jest.fn().mockResolvedValue({
        candidates: [
          {
            rank: 1,
            fairScore: 0.94,
            captainId: captain1Id,
            userId: captain1UserId,
            name: 'Captain One',
            vehicleId: vehicle1Id,
            distanceMeters: 650,
            estimatedEtaMinutes: 2,
            batterySocPercent: 88,
          },
          {
            rank: 2,
            fairScore: 0.85,
            captainId: captain2Id,
            userId: captain2UserId,
            name: 'Captain Two',
            vehicleId: vehicle2Id,
            distanceMeters: 1400,
            estimatedEtaMinutes: 4,
            batterySocPercent: 76,
          },
          {
            rank: 3,
            fairScore: 0.72,
            captainId: captain3Id,
            userId: 'user-cap-3',
            name: 'Captain Three',
            vehicleId: vehicle3Id,
            distanceMeters: 2800,
            estimatedEtaMinutes: 7,
            batterySocPercent: 65,
          },
        ],
        totalCandidatesFound: 3,
      }),
    };

    // Query builder mock supporting both Booking, DispatchOffer, and DriverProfile
    const createMockQueryBuilder = () => {
      let whereConditions: Record<string, unknown> = {};

      const qb: Record<string, jest.Mock> = {
        setLock: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockImplementation((_condition: string, params: Record<string, unknown>) => {
            whereConditions = { ...whereConditions, ...params };
            return qb;
          }),
        andWhere: jest
          .fn()
          .mockImplementation((_condition: string, params: Record<string, unknown>) => {
            whereConditions = { ...whereConditions, ...params };
            return qb;
          }),
        orderBy: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
        getOne: jest.fn().mockImplementation(async () => {
          if (whereConditions.id === bookingId) {
            return currentBooking;
          }
          if (whereConditions.id) {
            const found = existingOffers.find((o) => o.id === whereConditions.id);
            return found || null;
          }
          if (whereConditions.bookingId) {
            const pending = existingOffers.find(
              (o) =>
                o.bookingId === whereConditions.bookingId &&
                o.status === DispatchOfferStatus.PENDING,
            );
            return pending || null;
          }
          return null;
        }),
        getMany: jest.fn().mockImplementation(async () => {
          if (whereConditions.bookingId) {
            return existingOffers.filter((o) => o.bookingId === whereConditions.bookingId);
          }
          return existingOffers;
        }),
      };
      return qb;
    };

    mockEntityManager = {
      createQueryBuilder: jest.fn().mockImplementation((entityClass?: unknown) => {
        const qb = createMockQueryBuilder();
        if (entityClass === Booking) {
          qb.getOne.mockResolvedValue(currentBooking);
        }
        return qb;
      }),
      findOne: jest
        .fn()
        .mockImplementation(
          async (entityClass: unknown, options: { where: Record<string, unknown> }) => {
            if (entityClass === DriverProfile) {
              return {
                id: options.where.id,
                userId: options.where.id === captain1Id ? captain1UserId : captain2UserId,
              };
            }
            if (entityClass === Booking) {
              return currentBooking;
            }
            if (entityClass === DispatchOffer) {
              return existingOffers.find((o) => o.id === options.where.id) || null;
            }
            return null;
          },
        ),
      find: jest
        .fn()
        .mockImplementation(
          async (entityClass: unknown, options?: { where: Record<string, unknown> }) => {
            if (entityClass === DispatchOffer) {
              if (options?.where?.status) {
                return existingOffers.filter((o) => o.status === options.where.status);
              }
              return existingOffers;
            }
            return [];
          },
        ),
      create: jest.fn().mockImplementation((entityClass: unknown, dto: Record<string, unknown>) => {
        if (entityClass === DispatchOffer) {
          const instance = new DispatchOffer();
          instance.id = `off-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          instance.createdAt = new Date();
          instance.updatedAt = new Date();
          Object.assign(instance, dto);
          return instance;
        }
        return { id: `mock-${Date.now()}`, ...dto };
      }),
      save: jest
        .fn()
        .mockImplementation(async (_entityClass: unknown, entityOrInstance: unknown) => {
          const target = entityOrInstance || _entityClass;
          if (target instanceof DispatchOffer) {
            const idx = existingOffers.findIndex((o) => o.id === target.id);
            if (idx >= 0) {
              existingOffers[idx] = target;
            } else {
              existingOffers.push(target);
            }
          }
          return target;
        }),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb: (em: unknown) => Promise<unknown>) => {
        return cb(mockEntityManager);
      }),
      getRepository: jest.fn().mockImplementation((entityClass: unknown) => ({
        findOne: jest
          .fn()
          .mockImplementation(async (options: { where: Record<string, unknown> }) => {
            if (entityClass === DispatchOffer) {
              return existingOffers.find((o) => o.id === options.where.id) || null;
            }
            if (entityClass === Booking) {
              return currentBooking;
            }
            return null;
          }),
        find: jest.fn().mockImplementation(async (options?: { where: Record<string, unknown> }) => {
          if (entityClass === DispatchOffer) {
            if (options?.where?.bookingId) {
              return existingOffers.filter((o) => o.bookingId === options.where.bookingId);
            }
            if (options?.where?.status) {
              return existingOffers.filter((o) => o.status === options.where.status);
            }
            return existingOffers;
          }
          return [];
        }),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchOffersService,
        DispatchOffersQueueService,
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: CaptainAvailabilityService, useValue: mockCaptainAvailabilityService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<DispatchOffersService>(DispatchOffersService);
    queueService = module.get<DispatchOffersQueueService>(DispatchOffersQueueService);
  });

  afterEach(() => {
    queueService.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('1. Positive Timed Offer Creation & Acceptance', () => {
    it('should initiate dispatch, create a PENDING timed offer in PostgreSQL, and transition booking to DISPATCHING', async () => {
      const offer = await service.initiateDispatch(bookingId, {
        bookingId,
        offerTimeoutSeconds: 15,
        rankingStrategy: RankingStrategy.BALANCED_FAIR,
      });

      expect(offer).toBeDefined();
      expect(offer.captainId).toBe(captain1Id);
      expect(offer.vehicleId).toBe(vehicle1Id);
      expect(offer.offerSequence).toBe(1);
      expect(offer.status).toBe(DispatchOfferStatus.PENDING);
      expect(offer.offerTimeoutSeconds).toBe(15);
      expect(offer.timeoutJobId).toContain('job_offer_timeout_');
      expect(currentBooking.status).toBe(RideStatus.DISPATCHING);
      expect(currentBooking.dispatchingAt).toBeDefined();

      // Verify scheduled in Redis
      expect(mockRedisClient.zadd).toHaveBeenCalledWith(
        'dispatch:offers:timeouts',
        expect.any(Number),
        offer.id,
      );
    });

    it('should accept offer within TTL, assign ride to captain, set captain status to ON_TRIP, and cancel timeout', async () => {
      const activeOffer = createTestOffer();
      existingOffers.push(activeOffer);

      const result = await service.acceptOffer(
        activeOffer.id,
        { id: captain1Id, role: 'CAPTAIN', scopes: [] },
        'idemp-accept-001',
      );

      expect(result.bookingStatus).toBe(RideStatus.ASSIGNED);
      expect(result.assignedCaptainId).toBe(captain1Id);
      expect(result.assignedVehicleId).toBe(vehicle1Id);
      expect(result.offer.status).toBe(DispatchOfferStatus.ACCEPTED);
      expect(currentBooking.status).toBe(RideStatus.ASSIGNED);
      expect(currentBooking.captainId).toBe(captain1Id);
      expect(currentBooking.assignedAt).toBeDefined();

      // Timeout job cancelled in Redis
      expect(mockRedisClient.zrem).toHaveBeenCalledWith('dispatch:offers:timeouts', activeOffer.id);
    });

    it('should support idempotent accept retries by the same assigned captain without error', async () => {
      const activeOffer = createTestOffer({ status: DispatchOfferStatus.ACCEPTED });
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captain1Id;
      existingOffers.push(activeOffer);

      const result = await service.acceptOffer(
        activeOffer.id,
        { id: captain1Id, role: 'CAPTAIN', scopes: [] },
        'idemp-accept-retry',
      );

      expect(result.bookingStatus).toBe(RideStatus.ASSIGNED);
      expect(result.assignedCaptainId).toBe(captain1Id);
    });
  });

  describe('2. Acceptance Criteria 1 — Expired Offer Safeguards (Two accept attempts on expired offer fail)', () => {
    it('FIRST ATTEMPT: should reject accept on an expired offer (now > expiresAt), mark status as TIMED_OUT, and throw DISPATCH_OFFER_EXPIRED', async () => {
      // Offer expired 5 seconds ago
      const expiredOffer = createTestOffer({
        expiresAt: new Date(Date.now() - 5000),
        status: DispatchOfferStatus.PENDING,
      });
      existingOffers.push(expiredOffer);

      await expect(
        service.acceptOffer(
          expiredOffer.id,
          { id: captain1Id, role: 'CAPTAIN', scopes: [] },
          'idemp-att-1',
        ),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.acceptOffer(
          expiredOffer.id,
          { id: captain1Id, role: 'CAPTAIN', scopes: [] },
          'idemp-att-1',
        );
      } catch (err: unknown) {
        const error = err as BadRequestException;
        const response = error.getResponse() as Record<string, unknown>;
        expect(response.code).toBe(ApiErrorCode.DISPATCH_OFFER_EXPIRED);
      }

      // Definitive offer state updated to TIMED_OUT in PostgreSQL
      expect(expiredOffer.status).toBe(DispatchOfferStatus.TIMED_OUT);
      expect(expiredOffer.respondedAt).toBeDefined();

      // Ride was NEVER assigned
      expect(currentBooking.status).not.toBe(RideStatus.ASSIGNED);
      expect(currentBooking.captainId).toBeUndefined();
    });

    it('SECOND ATTEMPT: should also fail immediately on the same expired offer with DISPATCH_OFFER_EXPIRED', async () => {
      // Offer is already marked TIMED_OUT from the prior expiration check
      const timedOutOffer = createTestOffer({
        expiresAt: new Date(Date.now() - 10000),
        status: DispatchOfferStatus.TIMED_OUT,
        respondedAt: new Date(),
      });
      existingOffers.push(timedOutOffer);

      await expect(
        service.acceptOffer(
          timedOutOffer.id,
          { id: captain1Id, role: 'CAPTAIN', scopes: [] },
          'idemp-att-2',
        ),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.acceptOffer(
          timedOutOffer.id,
          { id: captain1Id, role: 'CAPTAIN', scopes: [] },
          'idemp-att-2',
        );
      } catch (err: unknown) {
        const error = err as BadRequestException;
        const response = error.getResponse() as Record<string, unknown>;
        expect(response.code).toBe(ApiErrorCode.DISPATCH_OFFER_EXPIRED);
        expect(response.message).toContain('expired and cannot be accepted');
      }

      // Booking remains unassigned
      expect(currentBooking.status).not.toBe(RideStatus.ASSIGNED);
    });
  });

  describe('3. Acceptance Criteria 2 — Double Assignment & Queued Retry Protection', () => {
    it('should NEVER double-assign when a delayed or duplicate queue retry fires for an already assigned ride', async () => {
      // 1. Captain 1 successfully claimed and was assigned the ride
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captain1Id;
      currentBooking.vehicleId = vehicle1Id;

      const staleOffer = createTestOffer({
        id: 'off-stale-001',
        status: DispatchOfferStatus.PENDING,
      });
      existingOffers.push(staleOffer);

      // 2. A delayed queue retry or concurrent worker fires timeoutOffer on the stale offer
      const result = await service.timeoutOffer('off-stale-001', {
        triggeredBy: 'QUEUE_WORKER',
        reason: 'Delayed retry firing',
      });

      // 3. Stale offer is superseded; NO redispatch is performed; ride remains assigned to Captain 1
      expect(result.redispatched).toBe(false);
      expect(result.bookingStatus).toBe(RideStatus.ASSIGNED);
      expect(staleOffer.status).toBe(DispatchOfferStatus.SUPERSEDED);
      expect(currentBooking.captainId).toBe(captain1Id);
      expect(currentBooking.status).toBe(RideStatus.ASSIGNED);

      // No second captain was offered or assigned!
      expect(existingOffers.filter((o) => o.status === DispatchOfferStatus.ACCEPTED).length).toBe(
        0,
      );
    });

    it('should reject a second captain trying to accept when booking was already assigned to another captain', async () => {
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captain1Id;
      currentBooking.vehicleId = vehicle1Id;

      const offerForCaptain2 = createTestOffer({
        id: 'off-cap-2',
        captainId: captain2Id,
        vehicleId: vehicle2Id,
        status: DispatchOfferStatus.PENDING,
      });
      existingOffers.push(offerForCaptain2);

      await expect(
        service.acceptOffer(
          offerForCaptain2.id,
          { id: captain2Id, role: 'CAPTAIN', scopes: [] },
          'idemp-cap-2',
        ),
      ).rejects.toThrow(ConflictException);

      try {
        await service.acceptOffer(
          offerForCaptain2.id,
          { id: captain2Id, role: 'CAPTAIN', scopes: [] },
          'idemp-cap-2',
        );
      } catch (err: unknown) {
        const error = err as ConflictException;
        const response = error.getResponse() as Record<string, unknown>;
        expect([ApiErrorCode.RIDE_ALREADY_TAKEN, ApiErrorCode.BOOKING_ALREADY_ASSIGNED]).toContain(
          response.code,
        );
      }

      // Offer for Captain 2 is marked SUPERSEDED
      expect(offerForCaptain2.status).toBe(DispatchOfferStatus.SUPERSEDED);
      // Original captain assignment remains strictly intact
      expect(currentBooking.captainId).toBe(captain1Id);
    });

    it('should refuse accept if the booking reached terminal status CANCELLED or FAILED', async () => {
      currentBooking.status = RideStatus.CANCELLED;
      const offer = createTestOffer();
      existingOffers.push(offer);

      await expect(
        service.acceptOffer(offer.id, { id: captain1Id, role: 'CAPTAIN', scopes: [] }),
      ).rejects.toThrow(ConflictException);

      try {
        await service.acceptOffer(offer.id, { id: captain1Id, role: 'CAPTAIN', scopes: [] });
      } catch (err: unknown) {
        const error = err as ConflictException;
        const response = error.getResponse() as Record<string, unknown>;
        expect(response.code).toBe(ApiErrorCode.RIDE_ALREADY_TERMINATED);
      }

      expect(offer.status).toBe(DispatchOfferStatus.CANCELLED);
    });
  });

  describe('4. Next-Captain Redispatch Policy & Fallback', () => {
    it('should automatically redispatch to candidate #2 when candidate #1 explicitly declines', async () => {
      const offer1 = createTestOffer({ id: 'off-1', offerSequence: 1 });
      existingOffers.push(offer1);

      const declineResult = await service.declineOffer(
        offer1.id,
        { id: captain1Id, role: 'CAPTAIN', scopes: [] },
        { reason: DispatchOfferDeclineReason.TOO_FAR, notes: 'Currently 15 mins away' },
      );

      expect(offer1.status).toBe(DispatchOfferStatus.DECLINED);
      expect(offer1.declineReason).toBe(DispatchOfferDeclineReason.TOO_FAR);
      expect(declineResult.redispatched).toBe(true);
      expect(declineResult.nextCaptainId).toBe(captain2Id);
      expect(declineResult.bookingStatus).toBe(RideStatus.REQUESTED);

      // Verify second offer exists in existingOffers with offerSequence = 2
      expect(existingOffers.length).toBe(2);
      const offer2 = existingOffers[1];
      expect(offer2.offerSequence).toBe(2);
      expect(offer2.captainId).toBe(captain2Id);
      expect(offer2.status).toBe(DispatchOfferStatus.PENDING);
    });

    it('should automatically redispatch to candidate #2 when candidate #1 times out', async () => {
      const offer1 = createTestOffer({ id: 'off-1', offerSequence: 1 });
      existingOffers.push(offer1);

      const timeoutResult = await service.timeoutOffer(offer1.id, {
        triggeredBy: 'QUEUE_WORKER',
        reason: '15s TTL expired',
      });

      expect(offer1.status).toBe(DispatchOfferStatus.TIMED_OUT);
      expect(timeoutResult.redispatched).toBe(true);
      expect(timeoutResult.nextCaptainId).toBe(captain2Id);

      expect(existingOffers.length).toBe(2);
      const offer2 = existingOffers[1];
      expect(offer2.offerSequence).toBe(2);
      expect(offer2.captainId).toBe(captain2Id);
    });

    it('should fail booking with NO_CAPTAINS_ACCEPTED when all MAX_REDISPATCH_ATTEMPTS are exhausted', async () => {
      // Simulate 3 prior declined/timed-out offers
      existingOffers.push(
        createTestOffer({ id: 'off-1', offerSequence: 1, status: DispatchOfferStatus.TIMED_OUT }),
        createTestOffer({
          id: 'off-2',
          captainId: captain2Id,
          offerSequence: 2,
          status: DispatchOfferStatus.DECLINED,
        }),
        createTestOffer({
          id: 'off-3',
          captainId: captain3Id,
          offerSequence: 3,
          status: DispatchOfferStatus.PENDING,
        }),
      );

      // Offer 3 times out
      const result = await service.timeoutOffer('off-3');

      expect(result.redispatched).toBe(false);
      expect(result.bookingStatus).toBe(RideStatus.FAILED);
      expect(currentBooking.status).toBe(RideStatus.FAILED);
      expect(currentBooking.failureReason).toBe('NO_CAPTAINS_ACCEPTED');
      expect(currentBooking.failedAt).toBeDefined();
    });

    it('should fail booking when candidate list is empty and no eligible captains exist in zone', async () => {
      (mockCaptainAvailabilityService.selectNearbyEligibleCaptains as jest.Mock).mockResolvedValue({
        candidates: [],
        totalCandidatesFound: 0,
      });

      await expect(service.initiateDispatch(bookingId)).rejects.toThrow(BadRequestException);

      expect(currentBooking.status).toBe(RideStatus.FAILED);
      expect(currentBooking.failureReason).toBe('NO_ELIGIBLE_CAPTAINS_NEARBY');
    });
  });

  describe('5. Security, Role & Ownership Checks', () => {
    it('should forbid Captain B from accepting Captain A dispatch offer', async () => {
      const offer = createTestOffer({ captainId: captain1Id });
      existingOffers.push(offer);

      await expect(
        service.acceptOffer(offer.id, { id: captain2Id, role: 'CAPTAIN', scopes: [] }),
      ).rejects.toThrow(ForbiddenException);

      try {
        await service.acceptOffer(offer.id, { id: captain2Id, role: 'CAPTAIN', scopes: [] });
      } catch (err: unknown) {
        const error = err as ForbiddenException;
        const response = error.getResponse() as Record<string, unknown>;
        expect(response.code).toBe(ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR);
      }
    });

    it('should forbid Captain B from declining Captain A dispatch offer', async () => {
      const offer = createTestOffer({ captainId: captain1Id });
      existingOffers.push(offer);

      await expect(
        service.declineOffer(offer.id, { id: captain2Id, role: 'CAPTAIN', scopes: [] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to accept or inspect on behalf of captain', async () => {
      const offer = createTestOffer({ captainId: captain1Id });
      existingOffers.push(offer);

      const result = await service.acceptOffer(offer.id, {
        id: 'admin-001',
        role: 'ADMIN',
        scopes: [],
      });

      expect(result.bookingStatus).toBe(RideStatus.ASSIGNED);
    });
  });

  describe('6. Reliable Sweeper & Queue Resilience', () => {
    it('should sweep overdue PENDING offers in PostgreSQL and time them out', async () => {
      const overdueOffer = createTestOffer({
        id: 'off-overdue-1',
        status: DispatchOfferStatus.PENDING,
        expiresAt: new Date(Date.now() - 20000), // 20s overdue
      });
      existingOffers.push(overdueOffer);

      const processedCount = await service.processExpiredOffers();

      expect(processedCount).toBe(1);
      expect(overdueOffer.status).toBe(DispatchOfferStatus.TIMED_OUT);
    });

    it('should register and cancel timers gracefully in queue service', async () => {
      const testOfferId = 'off-queue-test';
      const expiresAt = new Date(Date.now() + 5000);

      const jobId = await queueService.scheduleOfferTimeout(testOfferId, expiresAt);
      expect(jobId).toContain('job_offer_timeout_');
      expect(queueService.hasActiveTimer(testOfferId)).toBe(true);

      await queueService.cancelOfferTimeout(testOfferId);
      expect(queueService.hasActiveTimer(testOfferId)).toBe(false);
    });
  });
});
