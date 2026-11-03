import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import {
  ApiErrorCode,
  RideStatus,
  RideActorRole,
  TERMINAL_RIDE_STATUSES,
} from '@ecoride/contracts';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { QuotesService } from '../src/modules/quotes/quotes.service';
import { Booking } from '../src/database/entities/booking.entity';
import { RideStateEvent } from '../src/database/entities/ride-state-event.entity';
import { DataSource, EntityManager } from 'typeorm';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('Ride State Machine & Authorization (EV-038 Unit Specs)', () => {
  let bookingsService: BookingsService;
  let mockDataSource: Partial<DataSource>;
  let mockManager: Partial<EntityManager>;

  const riderAId = 'a0000000-0000-4000-8000-000000000001';
  const riderBId = 'a0000000-0000-4000-8000-000000000002';
  const captainAId = 'c0000000-0000-4000-8000-000000000001';
  const captainBId = 'c0000000-0000-4000-8000-000000000002';
  const vehicleAId = 'v0000000-0000-4000-8000-000000000001';
  const adminId = 'd0000000-0000-4000-8000-000000000001';
  const safetyOfficerId = 's0000000-0000-4000-8000-000000000001';

  const actorRiderA: CurrentActorPayload = { id: riderAId, role: RideActorRole.RIDER, scopes: [] };
  const actorRiderB: CurrentActorPayload = { id: riderBId, role: RideActorRole.RIDER, scopes: [] };
  const actorCaptainA: CurrentActorPayload = {
    id: captainAId,
    role: RideActorRole.CAPTAIN,
    scopes: [],
  };
  const actorCaptainB: CurrentActorPayload = {
    id: captainBId,
    role: RideActorRole.CAPTAIN,
    scopes: [],
  };
  const actorAdmin: CurrentActorPayload = { id: adminId, role: RideActorRole.ADMIN, scopes: [] };
  const actorSafetyOfficer: CurrentActorPayload = {
    id: safetyOfficerId,
    role: RideActorRole.SAFETY_OFFICER,
    scopes: [],
  };
  const actorFleetOwner: CurrentActorPayload = {
    id: 'f0000000-0000-4000-8000-000000000001',
    role: 'FLEET_OWNER',
    scopes: [],
  };

  let currentBooking: Booking;
  let savedEvents: RideStateEvent[];

  function createTestBooking(status: string = RideStatus.REQUESTED): Booking {
    return {
      id: 'b0000000-0000-4000-8000-000000000001',
      bookingCode: 'ECO-VZ-A1B2C3D4',
      riderId: riderAId,
      serviceCategory: 'CITY_COMMUTE_2W',
      status,
      pickupLocation: '0101000020E6100000...',
      dropoffLocation: '0101000020E6100000...',
      startOtp: '4821',
      fareAmount: 85.0,
      quoteId: 'q0000000-0000-4000-8000-000000000001',
      fareRuleId: 'f0000000-0000-4000-8000-000000000001',
      fareRuleVersion: 1,
      idempotencyKey: 'idemp-test-001',
      passengerCount: 1,
      requestedAt: new Date('2026-03-11T10:00:00Z'),
      createdAt: new Date('2026-03-11T10:00:00Z'),
      updatedAt: new Date('2026-03-11T10:00:00Z'),
    } as Booking;
  }

  beforeEach(() => {
    currentBooking = createTestBooking();
    savedEvents = [];

    const mockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(() => Promise.resolve(currentBooking)),
    };

    mockManager = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest.fn().mockImplementation((entity: Booking | RideStateEvent) => {
        if (entity instanceof RideStateEvent || ('toStatus' in entity && entity.toStatus)) {
          savedEvents.push(entity as RideStateEvent);
        } else {
          currentBooking = { ...(entity as Booking) };
        }
        return Promise.resolve(entity);
      }),
      create: jest.fn().mockImplementation((_entityClass, data) => ({
        ...data,
        id: data.id || 'e-uuid-test',
        createdAt: new Date(),
      })),
      findOne: jest.fn().mockImplementation((_cls, opts) => {
        if (opts?.where?.id === currentBooking.id) {
          return Promise.resolve(currentBooking);
        }
        return Promise.resolve(null);
      }),
      find: jest.fn().mockImplementation(() => Promise.resolve(savedEvents)),
    };

    mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: EntityManager) => Promise<unknown>) =>
          cb(mockManager as EntityManager),
        ),
      manager: mockManager as EntityManager,
    };

    bookingsService = new BookingsService(
      mockDataSource as DataSource,
      {} as unknown as QuotesService,
      undefined,
    );
  });

  describe('Happy Path: Complete Ride Lifecycle', () => {
    it('should transition REQUESTED -> DISPATCHING when requested by rider', async () => {
      const result = await bookingsService.dispatchRide(currentBooking.id, actorRiderA);

      expect(result.previousStatus).toBe(RideStatus.REQUESTED);
      expect(result.currentStatus).toBe(RideStatus.DISPATCHING);
      expect(result.timestamps.dispatchingAt).toBeDefined();
      expect(savedEvents).toHaveLength(1);
      expect(savedEvents[0].toStatus).toBe(RideStatus.DISPATCHING);
      expect(savedEvents[0].actorRole).toBe(RideActorRole.RIDER);
    });

    it('should normalize initial CREATED status to REQUESTED and allow DISPATCHING', async () => {
      currentBooking.status = 'CREATED';
      const result = await bookingsService.dispatchRide(currentBooking.id, actorRiderA);

      expect(result.previousStatus).toBe('CREATED');
      expect(result.currentStatus).toBe(RideStatus.DISPATCHING);
      expect(savedEvents[0].fromStatus).toBe(RideStatus.REQUESTED);
    });

    it('should transition DISPATCHING -> ASSIGNED when captain accepts with vehicle', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      const result = await bookingsService.assignCaptain(currentBooking.id, actorCaptainA, {
        captainId: captainAId,
        vehicleId: vehicleAId,
      });

      expect(result.previousStatus).toBe(RideStatus.DISPATCHING);
      expect(result.currentStatus).toBe(RideStatus.ASSIGNED);
      expect(result.captainId).toBe(captainAId);
      expect(result.vehicleId).toBe(vehicleAId);
      expect(result.timestamps.assignedAt).toBeDefined();
      expect(savedEvents[0].toStatus).toBe(RideStatus.ASSIGNED);
    });

    it('should transition ASSIGNED -> ARRIVED when assigned captain reaches pickup', async () => {
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captainAId;
      currentBooking.vehicleId = vehicleAId;

      const result = await bookingsService.markCaptainArrived(currentBooking.id, actorCaptainA);

      expect(result.previousStatus).toBe(RideStatus.ASSIGNED);
      expect(result.currentStatus).toBe(RideStatus.ARRIVED);
      expect(result.timestamps.arrivedAt).toBeDefined();
      expect(savedEvents[0].toStatus).toBe(RideStatus.ARRIVED);
    });

    it('should transition ARRIVED -> IN_PROGRESS when captain enters valid 4-digit OTP', async () => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.captainId = captainAId;
      currentBooking.vehicleId = vehicleAId;
      currentBooking.startOtp = '4821';

      const result = await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
        startOtp: '4821',
      });

      expect(result.previousStatus).toBe(RideStatus.ARRIVED);
      expect(result.currentStatus).toBe(RideStatus.IN_PROGRESS);
      expect(result.timestamps.tripStartedAt).toBeDefined();
      expect(savedEvents[0].toStatus).toBe(RideStatus.IN_PROGRESS);
    });

    it('should transition IN_PROGRESS -> COMPLETED when captain finishes trip at destination', async () => {
      currentBooking.status = RideStatus.IN_PROGRESS;
      currentBooking.captainId = captainAId;
      currentBooking.vehicleId = vehicleAId;

      const result = await bookingsService.completeRide(currentBooking.id, actorCaptainA);

      expect(result.previousStatus).toBe(RideStatus.IN_PROGRESS);
      expect(result.currentStatus).toBe(RideStatus.COMPLETED);
      expect(result.timestamps.tripCompletedAt).toBeDefined();
      expect(savedEvents[0].toStatus).toBe(RideStatus.COMPLETED);
    });
  });

  describe('Cancellation Flow & Safeguards', () => {
    it('should allow rider to cancel while REQUESTED', async () => {
      const result = await bookingsService.cancelRide(currentBooking.id, actorRiderA, {
        reason: 'Change of plans',
      });

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationDetails?.reason).toBe('Change of plans');
      expect(result.cancellationDetails?.cancelledByRole).toBe(RideActorRole.RIDER);
      expect(result.cancellationDetails?.cancelledById).toBe(riderAId);
    });

    it('should allow rider to cancel while DISPATCHING', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      const result = await bookingsService.cancelRide(currentBooking.id, actorRiderA, {
        reason: 'Waiting too long',
      });

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationDetails?.reason).toBe('Waiting too long');
    });

    it('should allow rider to cancel while ASSIGNED', async () => {
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captainAId;

      const result = await bookingsService.cancelRide(currentBooking.id, actorRiderA, {
        reason: 'Booked another EV',
      });

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
    });

    it('should allow assigned captain to cancel while ASSIGNED', async () => {
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captainAId;

      const result = await bookingsService.cancelRide(currentBooking.id, actorCaptainA, {
        reason: 'Vehicle flat tyre',
      });

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationDetails?.cancelledByRole).toBe(RideActorRole.CAPTAIN);
    });

    it('should strictly prohibit rider from unilaterally cancelling an IN_PROGRESS trip', async () => {
      currentBooking.status = RideStatus.IN_PROGRESS;
      currentBooking.captainId = captainAId;

      await expect(
        bookingsService.cancelRide(currentBooking.id, actorRiderA, {
          reason: 'I want to cancel now',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow safety officer or admin to cancel an IN_PROGRESS trip in emergency', async () => {
      currentBooking.status = RideStatus.IN_PROGRESS;
      currentBooking.captainId = captainAId;

      const result = await bookingsService.cancelRide(currentBooking.id, actorSafetyOfficer, {
        reason: 'Emergency route deviation triggered safety stop',
      });

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationDetails?.cancelledByRole).toBe(RideActorRole.SAFETY_OFFICER);
    });
  });

  describe('Failure Flow & Requirements', () => {
    it('should allow system to mark DISPATCHING as FAILED on dispatch timeout', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      const actorSystem: CurrentActorPayload = {
        id: '00000000-0000-0000-0000-000000000000',
        role: RideActorRole.SYSTEM,
        scopes: [],
      };
      const result = await bookingsService.failRide(currentBooking.id, actorSystem, {
        reason: 'Dispatch timeout: 180s expired with no captain acceptance',
      });

      expect(result.currentStatus).toBe(RideStatus.FAILED);
      expect(result.failureDetails?.reason).toBe(
        'Dispatch timeout: 180s expired with no captain acceptance',
      );
    });

    it('should reject FAILED transition if failure reason is missing or empty', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      await expect(
        bookingsService.failRide(currentBooking.id, actorAdmin, { reason: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject rider attempt to mark ride as FAILED', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      await expect(
        bookingsService.failRide(currentBooking.id, actorRiderA, { reason: 'No captains' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject captain attempt to mark ride as FAILED', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      await expect(
        bookingsService.failRide(currentBooking.id, actorCaptainA, {
          reason: 'Passenger not here',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Illegal Status Transitions (DAG Validation)', () => {
    it('should throw NotFoundException if booking does not exist', async () => {
      mockManager.createQueryBuilder = jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(
        bookingsService.transitionRideStatus('00000000-0000-0000-0000-000000000000', actorAdmin, {
          targetStatus: RideStatus.DISPATCHING,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject REQUESTED -> IN_PROGRESS illegal jump with ILLEGAL_STATUS_TRANSITION', async () => {
      try {
        await bookingsService.transitionRideStatus(currentBooking.id, actorAdmin, {
          targetStatus: RideStatus.IN_PROGRESS,
        });
        fail('Expected ILLEGAL_STATUS_TRANSITION to be thrown');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
        });
      }
    });

    it('should reject ASSIGNED -> COMPLETED illegal jump with ILLEGAL_STATUS_TRANSITION', async () => {
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captainAId;

      try {
        await bookingsService.transitionRideStatus(currentBooking.id, actorAdmin, {
          targetStatus: RideStatus.COMPLETED,
        });
        fail('Expected ILLEGAL_STATUS_TRANSITION to be thrown');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
        });
      }
    });

    it('should reject IN_PROGRESS -> ARRIVED backwards jump with ILLEGAL_STATUS_TRANSITION', async () => {
      currentBooking.status = RideStatus.IN_PROGRESS;
      currentBooking.captainId = captainAId;

      try {
        await bookingsService.transitionRideStatus(currentBooking.id, actorCaptainA, {
          targetStatus: RideStatus.ARRIVED,
        });
        fail('Expected ILLEGAL_STATUS_TRANSITION to be thrown');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
        });
      }
    });

    it('should reject DISPATCHING -> COMPLETED illegal jump', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      try {
        await bookingsService.transitionRideStatus(currentBooking.id, actorAdmin, {
          targetStatus: RideStatus.COMPLETED,
        });
        fail('Expected ILLEGAL_STATUS_TRANSITION to be thrown');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
        });
      }
    });
  });

  describe('Terminal Status Immutability', () => {
    it.each(TERMINAL_RIDE_STATUSES)(
      'should reject any transition from terminal status %s with RIDE_ALREADY_TERMINATED',
      async (terminalStatus) => {
        currentBooking.status = terminalStatus;

        try {
          await bookingsService.transitionRideStatus(currentBooking.id, actorAdmin, {
            targetStatus: RideStatus.IN_PROGRESS,
          });
          fail('Expected RIDE_ALREADY_TERMINATED to be thrown');
        } catch (err: unknown) {
          expect(err).toBeInstanceOf(ConflictException);
          expect((err as HttpException).getResponse()).toMatchObject({
            code: ApiErrorCode.RIDE_ALREADY_TERMINATED,
          });
        }
      },
    );
  });

  describe('Actor Role Authorization Safeguards', () => {
    it('should reject cross-account rider trying to dispatch or cancel another rider booking with UNAUTHORIZED_RIDE_ACTOR', async () => {
      try {
        await bookingsService.dispatchRide(currentBooking.id, actorRiderB);
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }

      try {
        await bookingsService.cancelRide(currentBooking.id, actorRiderB, {
          reason: 'Malicious cancel',
        });
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject rider attempting to assign captain', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      try {
        await bookingsService.assignCaptain(currentBooking.id, actorRiderA, {
          captainId: captainAId,
          vehicleId: vehicleAId,
        });
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject unassigned captain trying to mark arrived on another captain booking with UNAUTHORIZED_RIDE_ACTOR', async () => {
      currentBooking.status = RideStatus.ASSIGNED;
      currentBooking.captainId = captainAId; // Assigned to captain A

      try {
        await bookingsService.markCaptainArrived(currentBooking.id, actorCaptainB); // Captain B attempts
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject unassigned captain trying to start or complete ride', async () => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.captainId = captainAId;
      currentBooking.startOtp = '4821';

      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainB, {
          startOtp: '4821',
        });
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject captain trying to accept dispatch on behalf of another captain', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      try {
        await bookingsService.assignCaptain(currentBooking.id, actorCaptainA, {
          captainId: captainBId, // Captain A trying to assign Captain B
          vehicleId: vehicleAId,
        });
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject unauthorized actor roles (e.g. FLEET_OWNER, ANONYMOUS)', async () => {
      try {
        await bookingsService.dispatchRide(currentBooking.id, actorFleetOwner);
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });
  });

  describe('Start OTP Verification', () => {
    it('should reject captain start ride attempt with wrong OTP with INVALID_START_OTP', async () => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.captainId = captainAId;
      currentBooking.startOtp = '4821';

      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '9999', // Incorrect OTP
        });
        fail('Expected INVALID_START_OTP');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.INVALID_START_OTP,
        });
      }
    });

    it('should reject captain start ride attempt without OTP with INVALID_START_OTP', async () => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.captainId = captainAId;
      currentBooking.startOtp = '4821';

      try {
        await bookingsService.transitionRideStatus(currentBooking.id, actorCaptainA, {
          targetStatus: RideStatus.IN_PROGRESS,
        });
        fail('Expected INVALID_START_OTP');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.INVALID_START_OTP,
        });
      }
    });

    it('should allow admin or system to start ride in emergency without OTP', async () => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.captainId = captainAId;
      currentBooking.startOtp = '4821';

      const result = await bookingsService.transitionRideStatus(currentBooking.id, actorAdmin, {
        targetStatus: RideStatus.IN_PROGRESS,
      });

      expect(result.currentStatus).toBe(RideStatus.IN_PROGRESS);
    });
  });

  describe('Assignment Validation', () => {
    it('should reject captain assignment if vehicleId is missing', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      await expect(
        bookingsService.transitionRideStatus(currentBooking.id, actorCaptainA, {
          targetStatus: RideStatus.ASSIGNED,
          captainId: captainAId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject assignment if captainId is missing when assigned by admin', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      await expect(
        bookingsService.transitionRideStatus(currentBooking.id, actorAdmin, {
          targetStatus: RideStatus.ASSIGNED,
          vehicleId: vehicleAId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Ride Timeline Audit Log', () => {
    it('should return chronological list of state transition events for authorized rider', async () => {
      savedEvents.push(
        {
          id: 'ev-1',
          bookingId: currentBooking.id,
          fromStatus: null,
          toStatus: RideStatus.REQUESTED,
          actorId: riderAId,
          actorRole: RideActorRole.RIDER,
          metadata: {},
          createdAt: new Date('2026-03-11T10:00:00Z'),
        } as RideStateEvent,
        {
          id: 'ev-2',
          bookingId: currentBooking.id,
          fromStatus: RideStatus.REQUESTED,
          toStatus: RideStatus.DISPATCHING,
          actorId: riderAId,
          actorRole: RideActorRole.RIDER,
          metadata: {},
          createdAt: new Date('2026-03-11T10:01:00Z'),
        } as RideStateEvent,
      );

      const timeline = await bookingsService.getBookingEvents(currentBooking.id, actorRiderA);

      expect(timeline.bookingId).toBe(currentBooking.id);
      expect(timeline.eventsCount).toBe(2);
      expect(timeline.events[0].toStatus).toBe(RideStatus.REQUESTED);
      expect(timeline.events[1].toStatus).toBe(RideStatus.DISPATCHING);
    });

    it('should reject cross-account rider attempting to read event timeline', async () => {
      await expect(
        bookingsService.getBookingEvents(currentBooking.id, actorRiderB),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to read event timeline for any booking', async () => {
      const timeline = await bookingsService.getBookingEvents(currentBooking.id, actorAdmin);
      expect(timeline.bookingId).toBe(currentBooking.id);
    });
  });
});
