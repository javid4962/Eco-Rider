import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiErrorCode, RideStatus, RideActorRole } from '@ecoride/contracts';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { RidesController } from '../src/modules/bookings/rides.controller';
import { BookingsController } from '../src/modules/bookings/bookings.controller';
import { QuotesService } from '../src/modules/quotes/quotes.service';
import { Booking } from '../src/database/entities/booking.entity';
import { RideStateEvent } from '../src/database/entities/ride-state-event.entity';
import { DataSource, EntityManager } from 'typeorm';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('Pickup Arrival & Rider OTP Start (EV-045 Unit & Integration Specs)', () => {
  let bookingsService: BookingsService;
  let ridesController: RidesController;
  let bookingsController: BookingsController;
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
  const actorAnonymous: CurrentActorPayload = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'ANONYMOUS',
    scopes: [],
  };

  let currentBooking: Booking;
  let savedEvents: RideStateEvent[];

  function createAssignedBooking(): Booking {
    return {
      id: 'b0000000-0000-4000-8000-000000000001',
      bookingCode: 'ECO-VZ-A1B2C3D4',
      riderId: riderAId,
      captainId: captainAId,
      vehicleId: vehicleAId,
      serviceCategory: 'CITY_COMMUTE_2W',
      status: RideStatus.ASSIGNED,
      pickupLocation: '0101000020E6100000...',
      dropoffLocation: '0101000020E6100000...',
      startOtp: '4821',
      startOtpExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes in future
      startOtpFailedAttempts: 0,
      startOtpLockedUntil: null,
      startOtpRotatedAt: null,
      fareAmount: 85.0,
      quoteId: 'q0000000-0000-4000-8000-000000000001',
      fareRuleId: 'f0000000-0000-4000-8000-000000000001',
      fareRuleVersion: 1,
      idempotencyKey: 'idemp-test-001',
      passengerCount: 1,
      requestedAt: new Date('2026-03-11T10:00:00Z'),
      dispatchingAt: new Date('2026-03-11T10:01:00Z'),
      assignedAt: new Date('2026-03-11T10:02:00Z'),
      createdAt: new Date('2026-03-11T10:00:00Z'),
      updatedAt: new Date('2026-03-11T10:02:00Z'),
    } as Booking;
  }

  beforeEach(() => {
    currentBooking = createAssignedBooking();
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

    ridesController = new RidesController(bookingsService);
    bookingsController = new BookingsController(bookingsService);
  });

  describe('1. Pickup Arrival Authorization & State DAG Guards', () => {
    it('should allow assigned captain to mark arrival and set arrivedAt timestamp and refresh OTP expiry', async () => {
      const result = await bookingsService.markCaptainArrived(currentBooking.id, actorCaptainA);

      expect(result.previousStatus).toBe(RideStatus.ASSIGNED);
      expect(result.currentStatus).toBe(RideStatus.ARRIVED);
      expect(result.timestamps.arrivedAt).toBeDefined();
      expect(currentBooking.status).toBe(RideStatus.ARRIVED);
      expect(currentBooking.arrivedAt).toBeDefined();
      expect(currentBooking.startOtpExpiresAt).toBeDefined();

      expect(savedEvents).toHaveLength(1);
      expect(savedEvents[0].toStatus).toBe(RideStatus.ARRIVED);
      expect(savedEvents[0].actorRole).toBe(RideActorRole.CAPTAIN);
      expect(savedEvents[0].actorId).toBe(captainAId);
    });

    it('should reject unassigned captain (wrong user) trying to mark arrival with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      try {
        await bookingsService.markCaptainArrived(currentBooking.id, actorCaptainB);
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject passenger/rider (wrong user) trying to mark captain arrival with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      try {
        await bookingsService.markCaptainArrived(currentBooking.id, actorRiderA);
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject anonymous caller trying to mark arrival with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      try {
        await bookingsService.markCaptainArrived(currentBooking.id, actorAnonymous);
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject arrival on non-existent ride with 404 NOT_FOUND', async () => {
      (mockManager.createQueryBuilder as jest.Mock).mockReturnValueOnce({
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      try {
        await bookingsService.markCaptainArrived(
          '00000000-0000-0000-0000-000000000999',
          actorCaptainA,
        );
        fail('Expected NOT_FOUND');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.NOT_FOUND,
        });
      }
    });

    it('should reject arrival transition when ride is in REQUESTED or DISPATCHING status with 400 ILLEGAL_STATUS_TRANSITION', async () => {
      currentBooking.status = RideStatus.REQUESTED;
      currentBooking.captainId = undefined;

      try {
        await bookingsService.transitionRideStatus(currentBooking.id, actorCaptainA, {
          targetStatus: RideStatus.ARRIVED,
        });
        fail('Expected ILLEGAL_STATUS_TRANSITION');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
        });
      }
    });

    it('should reject arrival transition when ride has already reached terminal status with 409 RIDE_ALREADY_TERMINATED', async () => {
      currentBooking.status = RideStatus.CANCELLED;

      try {
        await bookingsService.markCaptainArrived(currentBooking.id, actorCaptainA);
        fail('Expected RIDE_ALREADY_TERMINATED');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.RIDE_ALREADY_TERMINATED,
        });
      }
    });

    it('should allow admin or safety officer to mark arrival in operational emergency', async () => {
      const result = await bookingsService.markCaptainArrived(
        currentBooking.id,
        actorSafetyOfficer,
      );

      expect(result.currentStatus).toBe(RideStatus.ARRIVED);
      expect(savedEvents[0].actorRole).toBe(RideActorRole.SAFETY_OFFICER);
    });
  });

  describe('2. Start-Before-Arrival & DAG Sequence Enforcement', () => {
    it('should strictly reject captain starting ride while in ASSIGNED status (start-before-arrival) with 400 ILLEGAL_STATUS_TRANSITION', async () => {
      // currentBooking is ASSIGNED; arrival has not yet been marked!
      expect(currentBooking.status).toBe(RideStatus.ASSIGNED);

      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '4821',
        });
        fail('Expected ILLEGAL_STATUS_TRANSITION for start-before-arrival');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as HttpException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.ILLEGAL_STATUS_TRANSITION);
        expect(res.message).toContain(
          'Trip cannot be started before captain marks arrival at pickup',
        );
      }
    });

    it('should reject start attempt while ride is in DISPATCHING or REQUESTED status', async () => {
      currentBooking.status = RideStatus.DISPATCHING;

      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '4821',
        });
        fail('Expected ILLEGAL_STATUS_TRANSITION');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
        });
      }
    });
  });

  describe('3. Rider OTP Start Verification & Wrong User Checks', () => {
    beforeEach(() => {
      // Advance booking legally to ARRIVED
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.arrivedAt = new Date();
      currentBooking.startOtp = '4821';
      currentBooking.startOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      currentBooking.startOtpFailedAttempts = 0;
      currentBooking.startOtpLockedUntil = null;
    });

    it('should successfully transition ARRIVED -> IN_PROGRESS when assigned captain provides correct OTP', async () => {
      const result = await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
        startOtp: '4821',
      });

      expect(result.previousStatus).toBe(RideStatus.ARRIVED);
      expect(result.currentStatus).toBe(RideStatus.IN_PROGRESS);
      expect(result.timestamps.tripStartedAt).toBeDefined();
      expect(currentBooking.status).toBe(RideStatus.IN_PROGRESS);
      expect(currentBooking.startOtpFailedAttempts).toBe(0);
      expect(currentBooking.startOtpLockedUntil).toBeNull();

      expect(savedEvents).toHaveLength(1);
      expect(savedEvents[0].toStatus).toBe(RideStatus.IN_PROGRESS);
    });

    it('should reject wrong captain trying to start ride with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
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

    it('should reject passenger/rider trying to trigger ride start with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorRiderA, {
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

    it('should reject incorrect OTP with 400 INVALID_START_OTP and track failed attempts counter', async () => {
      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '1111',
        });
        fail('Expected INVALID_START_OTP');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as HttpException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.INVALID_START_OTP);
        expect(res.message).toContain('2 attempt(s) remaining');
        expect(currentBooking.startOtpFailedAttempts).toBe(1);
      }
    });
  });

  describe('4. OTP Throttling, Lockout & Rate-Limiting Policy', () => {
    beforeEach(() => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.arrivedAt = new Date();
      currentBooking.startOtp = '4821';
      currentBooking.startOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      currentBooking.startOtpFailedAttempts = 0;
      currentBooking.startOtpLockedUntil = null;
    });

    it('should trigger temporary lockout after 3 consecutive wrong OTP attempts', async () => {
      // Attempt 1
      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '0001',
        });
      } catch {
        expect(currentBooking.startOtpFailedAttempts).toBe(1);
      }

      // Attempt 2
      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '0002',
        });
      } catch {
        expect(currentBooking.startOtpFailedAttempts).toBe(2);
      }

      // Attempt 3: Should trigger lockout
      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '0003',
        });
        fail('Expected OTP_ATTEMPTS_EXCEEDED');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as HttpException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.OTP_ATTEMPTS_EXCEEDED);
        expect(res.message).toContain('locked for 5 minutes');
        expect(currentBooking.startOtpFailedAttempts).toBe(3);
        expect(currentBooking.startOtpLockedUntil).not.toBeNull();
      }
    });

    it('should immediately reject attempts during active lockout period even if correct OTP is supplied', async () => {
      // Set active lockout for 4 more minutes
      currentBooking.startOtpFailedAttempts = 3;
      currentBooking.startOtpLockedUntil = new Date(Date.now() + 4 * 60 * 1000);

      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '4821', // Correct OTP, but locked
        });
        fail('Expected OTP_ATTEMPTS_EXCEEDED');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as HttpException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.OTP_ATTEMPTS_EXCEEDED);
        expect(res.message).toContain('Start verification is locked for another');
      }
    });
  });

  describe('5. OTP Expiration Enforcement', () => {
    beforeEach(() => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.arrivedAt = new Date();
      currentBooking.startOtp = '4821';
      currentBooking.startOtpFailedAttempts = 0;
      currentBooking.startOtpLockedUntil = null;
    });

    it('should reject start ride attempt when OTP has expired with 400 OTP_EXPIRED', async () => {
      // Set OTP expiration 5 minutes in the past
      currentBooking.startOtpExpiresAt = new Date(Date.now() - 5 * 60 * 1000);

      try {
        await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
          startOtp: '4821',
        });
        fail('Expected OTP_EXPIRED');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as HttpException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.OTP_EXPIRED);
        expect(res.message).toContain('Rider start OTP has expired');
      }
    });
  });

  describe('6. OTP Rotation / Regeneration Policy', () => {
    beforeEach(() => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.arrivedAt = new Date();
      currentBooking.startOtp = '4821';
      currentBooking.startOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      currentBooking.startOtpFailedAttempts = 2;
      currentBooking.startOtpLockedUntil = null;
      currentBooking.startOtpRotatedAt = null;
    });

    it('should allow authorized rider to rotate OTP, resetting failed attempts and clearing lockout', async () => {
      // Set lockout
      currentBooking.startOtpFailedAttempts = 3;
      currentBooking.startOtpLockedUntil = new Date(Date.now() + 5 * 60 * 1000);

      const result = await bookingsService.rotateStartOtp(currentBooking.id, actorRiderA);

      expect(result.bookingId).toBe(currentBooking.id);
      expect(result.startOtp).toBeDefined();
      expect(result.startOtp).toMatch(/^\d{4}$/);
      expect(result.startOtp).not.toBe('4821'); // Must be different
      expect(result.remainingAttempts).toBe(3);

      // Verify booking state in memory
      expect(currentBooking.startOtp).toBe(result.startOtp);
      expect(currentBooking.startOtpFailedAttempts).toBe(0);
      expect(currentBooking.startOtpLockedUntil).toBeNull();
      expect(currentBooking.startOtpRotatedAt).not.toBeNull();

      // Verify event was recorded
      expect(savedEvents).toHaveLength(1);
      expect(savedEvents[0].metadata?.action).toBe('OTP_ROTATED');

      // Now captain can start the ride immediately using the newly rotated OTP!
      const startResult = await bookingsService.startRideWithOtp(currentBooking.id, actorCaptainA, {
        startOtp: result.startOtp!,
      });
      expect(startResult.currentStatus).toBe(RideStatus.IN_PROGRESS);
    });

    it('should reject captain trying to rotate rider OTP with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      try {
        await bookingsService.rotateStartOtp(currentBooking.id, actorCaptainA);
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should reject cross-account rider trying to rotate another rider OTP with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      try {
        await bookingsService.rotateStartOtp(currentBooking.id, actorRiderB);
        fail('Expected UNAUTHORIZED_RIDE_ACTOR');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
        });
      }
    });

    it('should enforce 30-second rotation cooldown with 429 RATE_LIMITED', async () => {
      // Set recent rotation 10 seconds ago
      currentBooking.startOtpRotatedAt = new Date(Date.now() - 10 * 1000);

      try {
        await bookingsService.rotateStartOtp(currentBooking.id, actorRiderA);
        fail('Expected RATE_LIMITED');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.RATE_LIMITED,
        });
      }
    });

    it('should strictly prohibit OTP rotation once ride is already IN_PROGRESS', async () => {
      currentBooking.status = RideStatus.IN_PROGRESS;

      try {
        await bookingsService.rotateStartOtp(currentBooking.id, actorRiderA);
        fail('Expected ILLEGAL_STATUS_TRANSITION');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
        });
      }
    });

    it('should allow platform admin to rotate OTP and bypass cooldown', async () => {
      currentBooking.startOtpRotatedAt = new Date(Date.now() - 5 * 1000); // 5s ago

      const result = await bookingsService.rotateStartOtp(currentBooking.id, actorAdmin);
      expect(result.startOtp).toBeDefined();
    });
  });

  describe('7. Controller Parity & Endpoints Delegation', () => {
    it('should delegate RidesController.markCaptainArrived correctly to BookingsService', async () => {
      const spy = jest.spyOn(bookingsService, 'markCaptainArrived');
      await ridesController.markCaptainArrived(currentBooking.id, actorCaptainA, {
        metadata: { source: 'CAPTAIN_APP' },
      });

      expect(spy).toHaveBeenCalledWith(currentBooking.id, actorCaptainA, { source: 'CAPTAIN_APP' });
    });

    it('should delegate RidesController.startRide correctly to BookingsService', async () => {
      currentBooking.status = RideStatus.ARRIVED;
      currentBooking.arrivedAt = new Date();

      const spy = jest.spyOn(bookingsService, 'startRideWithOtp');
      await ridesController.startRide(currentBooking.id, { startOtp: '4821' }, actorCaptainA);

      expect(spy).toHaveBeenCalledWith(
        currentBooking.id,
        actorCaptainA,
        expect.objectContaining({ startOtp: '4821' }),
      );
    });

    it('should delegate RidesController.rotateOtp and BookingsController.rotateOtp correctly', async () => {
      const mockResponse = {
        bookingId: currentBooking.id,
        bookingCode: currentBooking.bookingCode,
        startOtp: '9876',
        expiresAt: new Date().toISOString(),
        rotatedAt: new Date().toISOString(),
        remainingAttempts: 3,
      };
      const spy = jest.spyOn(bookingsService, 'rotateStartOtp').mockResolvedValue(mockResponse);

      const res1 = await ridesController.rotateOtp(currentBooking.id, actorRiderA);
      expect(spy).toHaveBeenCalledWith(currentBooking.id, actorRiderA, undefined);
      expect(res1).toEqual(mockResponse);

      const res2 = await bookingsController.rotateOtp(currentBooking.id, actorRiderA);
      expect(spy).toHaveBeenCalledWith(currentBooking.id, actorRiderA, undefined);
      expect(res2).toEqual(mockResponse);
    });
  });
});
