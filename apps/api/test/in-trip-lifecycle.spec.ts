import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  RideStatus,
  RideActorRole,
  CaptainAvailabilityStatus,
  DutyStatus,
} from '@ecoride/contracts';
import { InTripService } from '../src/modules/bookings/in-trip.service';
import { Booking } from '../src/database/entities/booking.entity';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import { RideStateEvent } from '../src/database/entities/ride-state-event.entity';
import { DispatchOutboxEvent } from '../src/database/entities/dispatch-outbox-event.entity';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('In-Trip Lifecycle, Telemetry & Completion (EV-046 – EV-048)', () => {
  let service: InTripService;
  let mockDataSource: Partial<DataSource>;
  let mockManager: Partial<EntityManager>;

  const riderId = 'a0000000-0000-4000-8000-000000000001';
  const assignedCaptainId = 'c0000000-0000-4000-8000-000000000001';
  const otherCaptainId = 'c0000000-0000-4000-8000-000000000002';
  const adminId = 'd0000000-0000-4000-8000-000000000001';

  const actorAssignedCaptain: CurrentActorPayload = {
    id: assignedCaptainId,
    role: RideActorRole.CAPTAIN,
    scopes: [],
  };
  const actorOtherCaptain: CurrentActorPayload = {
    id: otherCaptainId,
    role: RideActorRole.CAPTAIN,
    scopes: [],
  };
  const actorRider: CurrentActorPayload = {
    id: riderId,
    role: RideActorRole.RIDER,
    scopes: [],
  };
  const actorAdmin: CurrentActorPayload = {
    id: adminId,
    role: RideActorRole.ADMIN,
    scopes: [],
  };

  let currentBooking: Booking;
  let savedLedgerEntries: LedgerEntry[];
  let savedStateEvents: RideStateEvent[];
  let savedOutboxEvents: DispatchOutboxEvent[];
  let updatedDriverProfile: Partial<DriverProfile> | null;

  function createActiveBooking(): Booking {
    return {
      id: 'b0000000-0000-4000-8000-000000000001',
      bookingCode: 'ECO-VZ-INTRIP-01',
      riderId,
      captainId: assignedCaptainId,
      vehicleId: 'v0000000-0000-4000-8000-000000000001',
      serviceCategory: 'CITY_COMMUTE_2W',
      status: RideStatus.IN_PROGRESS,
      fareAmount: 120.0, // ₹120.00 = 12000 paise
      passengerCount: 1,
      pickupLatitude: 16.5062,
      pickupLongitude: 80.648,
      dropoffLatitude: 16.52,
      dropoffLongitude: 80.65,
      tripStartedAt: new Date('2026-11-04T12:00:00Z'),
      createdAt: new Date('2026-11-04T11:55:00Z'),
      updatedAt: new Date('2026-11-04T12:00:00Z'),
    } as unknown as Booking;
  }

  beforeEach(() => {
    currentBooking = createActiveBooking();
    savedLedgerEntries = [];
    savedStateEvents = [];
    savedOutboxEvents = [];
    updatedDriverProfile = null;

    const mockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(() => Promise.resolve(currentBooking)),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockImplementation((setVals) => {
        updatedDriverProfile = setVals;
        return mockQueryBuilder;
      }),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockManager = {
      findOne: jest.fn().mockImplementation((entity, opts) => {
        if (entity === Booking) {
          if (opts?.where?.id === currentBooking.id) {
            return Promise.resolve(currentBooking);
          }
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      }),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      create: jest.fn().mockImplementation((_entity, data) => ({
        ...data,
        id: data.id || 'gen-uuid',
      })),
      save: jest.fn().mockImplementation((entities) => {
        const arr = Array.isArray(entities) ? entities : [entities];
        for (const item of arr) {
          if ('entryType' in item) {
            savedLedgerEntries.push(item as LedgerEntry);
          } else if ('fromStatus' in item) {
            savedStateEvents.push(item as RideStateEvent);
          } else if ('aggregateType' in item) {
            savedOutboxEvents.push(item as DispatchOutboxEvent);
          } else if ('bookingCode' in item) {
            Object.assign(currentBooking, item);
          }
        }
        return Promise.resolve(entities);
      }),
    };

    mockDataSource = {
      manager: mockManager as EntityManager,
      transaction: jest.fn().mockImplementation((cb) => cb(mockManager as EntityManager)),
    };

    service = new InTripService(mockDataSource as DataSource);
  });

  describe('EV-046: Real-time In-Trip Telemetry & GPS Freshness', () => {
    it('should accept fresh GPS telemetry from the assigned captain and return distance/ETA', async () => {
      const result = await service.recordInTripTelemetry(
        currentBooking.id,
        actorAssignedCaptain,
        {
          latitude: 16.51,
          longitude: 80.649,
          accuracyMeters: 4.2,
          speedKmph: 32.5,
          headingDegrees: 90.0,
          batterySocPercent: 82.0,
          recordedAt: new Date().toISOString(),
        },
      );

      expect(result.bookingId).toBe(currentBooking.id);
      expect(result.currentLatitude).toBe(16.51);
      expect(result.currentLongitude).toBe(80.649);
      expect(result.distanceRemainingMeters).toBeGreaterThan(0);
      expect(result.etaSeconds).toBeGreaterThan(0);
      expect(result.isOffRoute).toBe(false);
    });

    it('should reject stale GPS telemetry older than 30 seconds', async () => {
      const staleTimestamp = new Date(Date.now() - 45 * 1000).toISOString(); // 45s ago

      await expect(
        service.recordInTripTelemetry(currentBooking.id, actorAssignedCaptain, {
          latitude: 16.51,
          longitude: 80.649,
          recordedAt: staleTimestamp,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject telemetry submitted by a non-assigned captain or rider', async () => {
      await expect(
        service.recordInTripTelemetry(currentBooking.id, actorOtherCaptain, {
          latitude: 16.51,
          longitude: 80.649,
          recordedAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.recordInTripTelemetry(currentBooking.id, actorRider, {
          latitude: 16.51,
          longitude: 80.649,
          recordedAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject telemetry when ride is in terminal status (COMPLETED)', async () => {
      currentBooking.status = RideStatus.COMPLETED;

      await expect(
        service.recordInTripTelemetry(currentBooking.id, actorAssignedCaptain, {
          latitude: 16.51,
          longitude: 80.649,
          recordedAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('EV-047: Dropoff Arrival & Proximity Verification', () => {
    it('should allow assigned captain to mark dropoff arrival when ride is IN_PROGRESS', async () => {
      const result = await service.markDropoffArrival(
        currentBooking.id,
        actorAssignedCaptain,
        {
          latitude: 16.52,
          longitude: 80.65,
          odometerKm: 5.6,
        },
      );

      expect(result.bookingId).toBe(currentBooking.id);
      expect(result.status).toBe(RideStatus.IN_PROGRESS);
      expect(result.arrivedAtDropoff).toBe(true);
      expect(result.distanceToDropoffMeters).toBeDefined();
    });

    it('should reject dropoff arrival if ride is not in IN_PROGRESS status', async () => {
      currentBooking.status = RideStatus.ASSIGNED;

      await expect(
        service.markDropoffArrival(currentBooking.id, actorAssignedCaptain, {
          latitude: 16.52,
          longitude: 80.65,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('EV-048: Ride Completion, Double-Entry Ledger & Duty Reset', () => {
    it('should finalize ride completion, write balanced double-entry ledger entries, and reset captain to AVAILABLE', async () => {
      const completionResult = await service.finalizeRideCompletion(
        currentBooking.id,
        actorAssignedCaptain,
        {
          finalDistanceMeters: 5600,
          finalDurationSeconds: 780,
          tollAmountPaise: 1000, // ₹10.00 toll
          tipPaise: 500, // ₹5.00 tip
          idempotencyKey: 'idemp_comp_test_001',
        },
      );

      expect(completionResult.status).toBe(RideStatus.COMPLETED);
      expect(currentBooking.status).toBe(RideStatus.COMPLETED);
      expect(currentBooking.tripCompletedAt).toBeDefined();

      // Fare calculation check:
      // Base: ₹120.00 = 12000 paise
      // Tolls: 1000 paise
      // Tip: 500 paise
      // Total: 13500 paise
      expect(completionResult.finalFarePaise).toBe(13500);
      expect(completionResult.formattedFare).toBe('₹135.00');

      // Verify double-entry ledger entries
      expect(savedLedgerEntries.length).toBe(3);

      const debitEntry = savedLedgerEntries.find((e) => e.entryType === 'DEBIT')!;
      const captainCredit = savedLedgerEntries.find(
        (e) => e.entryType === 'CREDIT' && e.accountId.includes('CAPTAIN'),
      )!;
      const platformCredit = savedLedgerEntries.find(
        (e) => e.entryType === 'CREDIT' && e.accountId.includes('PLATFORM'),
      )!;

      expect(debitEntry).toBeDefined();
      expect(captainCredit).toBeDefined();
      expect(platformCredit).toBeDefined();

      // Exact mathematical balance: DEBIT === SUM(CREDITS)
      expect(debitEntry.amountPaise).toBe(13500);
      expect(captainCredit.amountPaise + platformCredit.amountPaise).toBe(debitEntry.amountPaise);

      // Captain earnings: 80% of (12000 + 1000) = 10400 + 500 tip = 10900 paise
      expect(captainCredit.amountPaise).toBe(10900);
      // Platform fee: 20% of 13000 = 2600 paise
      expect(platformCredit.amountPaise).toBe(2600);

      // Verify captain status was reset to AVAILABLE
      expect(updatedDriverProfile).toBeDefined();
      expect(updatedDriverProfile?.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      expect(updatedDriverProfile?.dutyStatus).toBe(DutyStatus.ONLINE);

      // Verify Outbox Event created
      expect(savedOutboxEvents.length).toBe(1);
      expect(savedOutboxEvents[0].eventType).toBe('RIDE_COMPLETED');
      expect(savedOutboxEvents[0].aggregateId).toBe(currentBooking.id);

      // Verify State Event recorded
      expect(savedStateEvents.length).toBe(1);
      expect(savedStateEvents[0].fromStatus).toBe(RideStatus.IN_PROGRESS);
      expect(savedStateEvents[0].toStatus).toBe(RideStatus.COMPLETED);
    });

    it('should be idempotent: completing an already completed ride returns cached completion without duplicate ledger entries', async () => {
      currentBooking.status = RideStatus.COMPLETED;
      currentBooking.tripCompletedAt = new Date();
      currentBooking.fareAmount = 135.0;

      const result = await service.finalizeRideCompletion(
        currentBooking.id,
        actorAssignedCaptain,
        {
          idempotencyKey: 'idemp_comp_replay',
        },
      );

      expect(result.status).toBe(RideStatus.COMPLETED);
      expect(result.finalFarePaise).toBe(13500);
      expect(savedLedgerEntries.length).toBe(0); // Zero duplicate ledger writes on replay
    });

    it('should reject completion attempt if ride is not in IN_PROGRESS status', async () => {
      currentBooking.status = RideStatus.REQUESTED;

      await expect(
        service.finalizeRideCompletion(currentBooking.id, actorAssignedCaptain, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject completion attempt by unauthorized user', async () => {
      await expect(
        service.finalizeRideCompletion(currentBooking.id, actorOtherCaptain, {}),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.finalizeRideCompletion(currentBooking.id, actorRider, {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow platform Admin / Ops to finalize ride completion', async () => {
      const result = await service.finalizeRideCompletion(
        currentBooking.id,
        actorAdmin,
        {
          idempotencyKey: 'idemp_comp_admin',
        },
      );

      expect(result.status).toBe(RideStatus.COMPLETED);
      expect(result.finalFarePaise).toBe(12000);
      expect(savedLedgerEntries.length).toBe(3);
    });
  });
});
