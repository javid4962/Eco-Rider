import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import {
  ApiErrorCode,
  PropulsionType,
  VehicleVerificationStatus,
  RangeTelemetrySource,
  PlatformRole,
} from '@ecoride/contracts';
import { BatteryDispatchService } from '../src/modules/compliance/battery-dispatch.service';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('BatteryDispatchService (EV-041 Battery-Aware Dispatch Eligibility)', () => {
  let service: BatteryDispatchService;
  let mockDriverProfileRepository: Record<string, jest.Mock>;
  let mockVehicleRepository: Record<string, jest.Mock>;
  let mockConfigService: Partial<ConfigService>;

  const captainAliceUserId = 'a0410000-0000-4000-8000-000000000001';
  const captainBobUserId = 'b0410000-0000-4000-8000-000000000002';
  const driverProfileAliceId = 'd0410000-0000-4000-8000-000000000001';
  const vehicleAliceId = 'v0410000-0000-4000-8000-000000000001';

  const actorAlice: CurrentActorPayload = {
    id: captainAliceUserId,
    role: PlatformRole.CAPTAIN,
    scopes: ['driver:self', 'telemetry:emit:self'],
  };

  const actorBob: CurrentActorPayload = {
    id: captainBobUserId,
    role: PlatformRole.CAPTAIN,
    scopes: ['driver:self', 'telemetry:emit:self'],
  };

  const actorAdmin: CurrentActorPayload = {
    id: 'admin000-0000-4000-8000-000000000001',
    role: PlatformRole.SUPER_ADMIN,
    scopes: ['*'],
  };

  function createTestVehicle(overrides?: Partial<Vehicle>): Vehicle {
    const v = new Vehicle();
    v.id = vehicleAliceId;
    v.registrationNumber = 'AP39-EV-1001';
    v.propulsionType = PropulsionType.BATTERY_ELECTRIC;
    v.vehicleCategory = 'CITY_COMMUTE_2W';
    v.serviceClass = 'ECO_BIKE';
    v.batteryCapacityKwh = 3.7;
    v.currentSocPercent = 85.0;
    v.ratedRangeKm = 110;
    v.rangeTelemetrySource = RangeTelemetrySource.OBD_TELEMATICS;
    v.telemetryDeviceId = 'OBD-ATH-001';
    v.telemetryLastPingAt = new Date(); // fresh
    v.greenPlateVerified = true;
    v.verificationStatus = VehicleVerificationStatus.VERIFIED;
    v.isActive = true;
    v.insuranceExpiryDate = new Date(Date.now() + 180 * 86400000);
    v.fitnessExpiryDate = new Date(Date.now() + 180 * 86400000);
    v.commercialPermitExpiry = new Date(Date.now() + 180 * 86400000);
    v.city = 'visakhapatnam';
    v.createdAt = new Date();
    v.updatedAt = new Date();

    return Object.assign(v, overrides);
  }

  function createTestDriverProfile(vehicle?: Vehicle): DriverProfile {
    const dp = new DriverProfile();
    dp.id = driverProfileAliceId;
    dp.userId = captainAliceUserId;
    dp.licenseNumber = 'AP39-2026-0001';
    dp.verificationStatus = 'VERIFIED';
    dp.dutyStatus = 'ONLINE';
    dp.availabilityStatus = 'AVAILABLE';
    dp.currentLatitude = 17.72;
    dp.currentLongitude = 83.31;
    dp.locationAccuracyMeters = 8.0;
    dp.locationUpdatedAt = new Date();
    dp.batterySocPercent = 85.0;
    dp.city = 'visakhapatnam';
    dp.assignedVehicleId = vehicle ? vehicle.id : vehicleAliceId;
    dp.assignedVehicle = vehicle || createTestVehicle();
    dp.createdAt = new Date();
    dp.updatedAt = new Date();
    return dp;
  }

  beforeEach(async () => {
    mockDriverProfileRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockVehicleRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatteryDispatchService,
        {
          provide: getRepositoryToken(DriverProfile),
          useValue: mockDriverProfileRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BatteryDispatchService>(BatteryDispatchService);
  });

  describe('1. Positive Dispatch Feasibility (Healthy BEV with Fresh Range)', () => {
    it('should approve dispatch when battery range satisfies pickup, journey, reserve, and contingency', async () => {
      const vehicle = createTestVehicle({ currentSocPercent: 85.0, ratedRangeKm: 110 });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      // Trip: RTC Complex (17.7271, 83.3039) to Maddilapalem (17.7388, 83.3289) ~ 3.0 km
      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
          tripDistanceKm: 3.5,
          pickupDistanceKm: 1.0,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(true);
      expect(result.exclusionCode).toBeNull();
      expect(result.ineligibilityReasons).toHaveLength(0);
      expect(result.manualRecoveryPath).toBeNull();

      expect(result.vehicleDetails).toBeDefined();
      expect(result.vehicleDetails?.propulsionType).toBe('BATTERY_ELECTRIC');
      expect(result.vehicleDetails?.currentSocPercent).toBe(85.0);
      expect(result.vehicleDetails?.practicalRangeKm).toBe(94); // 110 * 0.85 = 93.5 -> 94
      expect(result.vehicleDetails?.isTelemetryFresh).toBe(true);

      expect(result.tripDistanceBreakdown.pickupDistanceKm).toBe(1.0);
      expect(result.tripDistanceBreakdown.passengerJourneyDistanceKm).toBe(3.5);
      expect(result.tripDistanceBreakdown.reserveMarginKm).toBe(8.0);
      expect(result.tripDistanceBreakdown.contingencyChargerDistanceKm).toBeGreaterThanOrEqual(5.0);
      expect(result.tripDistanceBreakdown.projectedPostTripSocPercent).toBeGreaterThan(15.0);
    });
  });

  describe('2. Low Battery Exclusion (DISPATCH_BATTERY_INSUFFICIENT)', () => {
    it('should exclude vehicle if current SoC is below statutory minimum reserve (e.g. 12% < 15%)', async () => {
      const vehicle = createTestVehicle({ currentSocPercent: 12.0, ratedRangeKm: 110 });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
          tripDistanceKm: 3.0,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT);
      expect(
        result.ineligibilityReasons.some((r) =>
          r.includes('below minimum reserve safety threshold'),
        ),
      ).toBe(true);

      // Verify documented manual recovery path
      expect(result.manualRecoveryPath).toBeDefined();
      expect(result.manualRecoveryPath?.exclusionType).toBe('LOW_BATTERY');
      expect(result.manualRecoveryPath?.actionSteps.length).toBeGreaterThanOrEqual(3);
      expect(result.manualRecoveryPath?.nearestChargingDepot).toBeDefined();
      expect(result.manualRecoveryPath?.recalibrationOrSyncEndpoint).toBe(
        '/v1/captains/me/battery/sync',
      );
    });

    it('should exclude vehicle if trip distance plus contingency causes projected SoC to breach reserve margin', async () => {
      // 30% SoC on 100km vehicle = 30km range.
      // Trip 18km + pickup 2km + contingency 5km = 25km mission distance + 8km reserve = 33km required.
      const vehicle = createTestVehicle({ currentSocPercent: 30.0, ratedRangeKm: 100 });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.85,
          dropoffLongitude: 83.4,
          tripDistanceKm: 18.0,
          pickupDistanceKm: 2.0,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT);
      expect(
        result.ineligibilityReasons.some((r) =>
          r.includes('insufficient for total required mission distance'),
        ),
      ).toBe(true);
    });
  });

  describe('3. Unknown & Stale Range Telemetry Exclusion (DISPATCH_RANGE_STALE_OR_UNKNOWN)', () => {
    it('should exclude vehicle if telemetry ping timestamp is missing (null)', async () => {
      const vehicle = createTestVehicle({ telemetryLastPingAt: null });
      const driverProfile = createTestDriverProfile(vehicle);
      driverProfile.locationUpdatedAt = null;
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_RANGE_STALE_OR_UNKNOWN);
      expect(
        result.ineligibilityReasons.some((r) =>
          r.includes('Battery telemetry has never been ingested'),
        ),
      ).toBe(true);

      // Verify recovery guide
      expect(result.manualRecoveryPath?.exclusionType).toBe('STALE_OR_UNKNOWN_RANGE');
      expect(
        result.manualRecoveryPath?.actionSteps.some((s) => s.includes('OBD-II telemetry dongle')),
      ).toBe(true);
    });

    it('should exclude vehicle if OBD-II telematics ping is older than freshness threshold (180s > 120s)', async () => {
      const staleTimestamp = new Date(Date.now() - 180 * 1000);
      const vehicle = createTestVehicle({
        telemetryLastPingAt: staleTimestamp,
        rangeTelemetrySource: RangeTelemetrySource.OBD_TELEMATICS,
      });
      const driverProfile = createTestDriverProfile(vehicle);
      driverProfile.locationUpdatedAt = staleTimestamp;
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_RANGE_STALE_OR_UNKNOWN);
      expect(
        result.ineligibilityReasons.some((r) => r.includes('Battery telemetry is stale')),
      ).toBe(true);
      expect(result.vehicleDetails?.isTelemetryFresh).toBe(false);
    });

    it('should respect telemetry source-aware TTL (OEM cloud API allows up to 300s, Manual allows up to 600s)', async () => {
      // 200s old ping with OEM_CLOUD_API should be accepted as fresh (allowed <= 300s)
      const oemTimestamp = new Date(Date.now() - 200 * 1000);
      const vehicle = createTestVehicle({
        telemetryLastPingAt: oemTimestamp,
        rangeTelemetrySource: RangeTelemetrySource.OEM_CLOUD_API,
        currentSocPercent: 80.0,
      });
      const driverProfile = createTestDriverProfile(vehicle);
      driverProfile.locationUpdatedAt = oemTimestamp;
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
          tripDistanceKm: 3.0,
          pickupDistanceKm: 1.0,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(true);
      expect(result.vehicleDetails?.isTelemetryFresh).toBe(true);
    });
  });

  describe('4. Unapproved EV Exclusion (DISPATCH_VEHICLE_UNAPPROVED)', () => {
    it('should reject non-electric vehicle with DISPATCH_VEHICLE_UNAPPROVED', async () => {
      const vehicle = createTestVehicle({ propulsionType: 'PETROL' });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED);
      expect(
        result.ineligibilityReasons.some((r) =>
          r.includes('Vehicle propulsion is not 100% Battery Electric'),
        ),
      ).toBe(true);
      expect(result.manualRecoveryPath?.exclusionType).toBe('UNAPPROVED_VEHICLE');
    });

    it('should reject vehicle with unverified verification status (PENDING_VERIFICATION)', async () => {
      const vehicle = createTestVehicle({
        verificationStatus: VehicleVerificationStatus.PENDING_VERIFICATION,
      });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED);
      expect(
        result.ineligibilityReasons.some((r) =>
          r.includes('Only VERIFIED vehicles can receive dispatch offers'),
        ),
      ).toBe(true);
    });

    it('should reject vehicle with unverified green commercial plate', async () => {
      const vehicle = createTestVehicle({ greenPlateVerified: false });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED);
      expect(
        result.ineligibilityReasons.some((r) =>
          r.includes('green plate permit has not been verified'),
        ),
      ).toBe(true);
    });

    it('should reject vehicle when statutory roadworthiness documents are expired', async () => {
      const vehicle = createTestVehicle({
        insuranceExpiryDate: new Date(Date.now() - 5 * 86400000), // Expired 5 days ago
      });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED);
      expect(
        result.ineligibilityReasons.some((r) => r.includes('statutory compliance check failed')),
      ).toBe(true);
    });

    it('should reject dispatch if captain has no assigned vehicle', async () => {
      const driverProfile = createTestDriverProfile();
      driverProfile.assignedVehicle = undefined;
      driverProfile.assignedVehicleId = undefined;
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(null);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED);
      expect(result.ineligibilityReasons.some((r) => r.includes('No EV vehicle assigned'))).toBe(
        true,
      );
    });
  });

  describe('5. Excessive Pickup Distance Exclusion', () => {
    it('should exclude dispatch offer if transit distance to pickup exceeds policy threshold (18km > 15km)', async () => {
      const vehicle = createTestVehicle({ currentSocPercent: 90.0 });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.7388,
          dropoffLongitude: 83.3289,
          pickupDistanceKm: 18.5, // Exceeds default 15.0 km limit
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(
        result.ineligibilityReasons.some((r) => r.includes('Transit distance to pickup')),
      ).toBe(true);
    });
  });

  describe('6. Policy Thresholds & Configurable Overrides', () => {
    it('should apply request-level policy overrides to dynamically modify evaluation boundaries', async () => {
      const vehicle = createTestVehicle({ currentSocPercent: 22.0, ratedRangeKm: 100 });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      // Default policy has minReserveSoc = 15.0%. 22% SoC would pass standard check for a tiny trip.
      // But with policyOverride minReserveSoc = 25.0%, it should fail!
      const result = await service.evaluateDispatchEligibility(
        {
          captainId: captainAliceUserId,
          pickupLatitude: 17.7271,
          pickupLongitude: 83.3039,
          dropoffLatitude: 17.73,
          dropoffLongitude: 83.305,
          tripDistanceKm: 0.5,
          pickupDistanceKm: 0.1,
          policyOverrides: {
            minReserveSocPercent: 25.0,
          },
        },
        actorAlice,
      );

      expect(result.isEligible).toBe(false);
      expect(result.exclusionCode).toBe(ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT);
      expect(
        result.ineligibilityReasons.some((r) =>
          r.includes('below minimum reserve safety threshold (25%)'),
        ),
      ).toBe(true);
    });
  });

  describe('7. Nearest AP Pilot Charging Depot Resolution', () => {
    it('should resolve nearest verified AP pilot depot and compute contingency distance', () => {
      // Near Dwaraka Nagar / RTC complex (17.7270, 83.3040)
      const nearest = service.findNearestDepot(17.727, 83.304, 'visakhapatnam');
      expect(nearest).toBeDefined();
      expect(nearest?.depot.id).toBe('ap-depot-rtc-complex');
      expect(nearest?.distanceKm).toBeLessThan(1.0);

      // Near Rushikonda IT SEZ (17.7818, 83.3778)
      const nearestRushikonda = service.findNearestDepot(17.7818, 83.3778, 'visakhapatnam');
      expect(nearestRushikonda?.depot.id).toBe('ap-depot-rushikonda');
      expect(nearestRushikonda?.distanceKm).toBeLessThan(1.0);
    });
  });

  describe('8. Manual Recovery Flow (syncCaptainBattery)', () => {
    it('should update vehicle and driver profile SoC, refresh last ping, and restore eligibility', async () => {
      const vehicle = createTestVehicle({ currentSocPercent: 10.0 });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const syncResult = await service.syncCaptainBattery(actorAlice, captainAliceUserId, {
        currentSocPercent: 92.0,
        rangeTelemetrySource: RangeTelemetrySource.BMS_IOT_GATEWAY,
        telemetryDeviceId: 'BMS-FAST-CHARGE-01',
        notes: 'Charged to 92% at APSRTC Central Fast Charging Hub',
      });

      expect(syncResult.previousSocPercent).toBe(10.0);
      expect(syncResult.currentSocPercent).toBe(92.0);
      expect(syncResult.source).toBe(RangeTelemetrySource.BMS_IOT_GATEWAY);
      expect(mockVehicleRepository.save).toHaveBeenCalled();
      expect(mockDriverProfileRepository.save).toHaveBeenCalled();
      expect(vehicle.currentSocPercent).toBe(92.0);
      expect(vehicle.telemetryLastPingAt).toBeDefined();
    });
  });

  describe('9. Cross-Captain Authorization Safeguards', () => {
    it('should reject unauthorized cross-captain battery evaluation with 403 Forbidden', async () => {
      const vehicle = createTestVehicle();
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);

      // Bob tries to evaluate Alice's vehicle
      await expect(
        service.evaluateDispatchEligibility(
          {
            captainId: captainAliceUserId,
            pickupLatitude: 17.7271,
            pickupLongitude: 83.3039,
            dropoffLatitude: 17.7388,
            dropoffLongitude: 83.3289,
          },
          actorBob, // Bob
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject unauthorized cross-captain battery sync with 403 Forbidden', async () => {
      await expect(
        service.syncCaptainBattery(actorBob, captainAliceUserId, {
          currentSocPercent: 90.0,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin or dispatcher to evaluate and sync any captain battery', async () => {
      const vehicle = createTestVehicle({ currentSocPercent: 20.0 });
      const driverProfile = createTestDriverProfile(vehicle);
      mockDriverProfileRepository.findOne.mockResolvedValue(driverProfile);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const syncResult = await service.syncCaptainBattery(actorAdmin, captainAliceUserId, {
        currentSocPercent: 88.0,
        rangeTelemetrySource: RangeTelemetrySource.OBD_TELEMATICS,
      });

      expect(syncResult.currentSocPercent).toBe(88.0);
    });
  });
});
