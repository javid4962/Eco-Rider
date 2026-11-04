import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  PropulsionType,
  VehicleCategory,
  VehicleServiceClass,
  VehicleVerificationStatus,
  CaptainAvailabilityStatus,
  DutyStatus,
  DriverComplianceStatus,
  RankingStrategy,
  GeoJsonPolygon,
} from '@ecoride/contracts';
import { CaptainAvailabilityService } from '../src/modules/compliance/captain-availability.service';
import { ComplianceService } from '../src/modules/compliance/compliance.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';
import { CaptainLocationPing } from '../src/database/entities/captain-location-ping.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { Zone } from '../src/database/entities/zone.entity';
import { User } from '../src/database/entities/user.entity';
import { ZonesService } from '../src/modules/zones/zones.service';

describe('CaptainAvailabilityService — Nearby Eligible Captain Selection (EV-042)', () => {
  let service: CaptainAvailabilityService;
  let mockDriverProfileRepository: Record<string, jest.Mock>;
  let mockLocationPingRepository: Record<string, jest.Mock>;
  let mockZoneRepository: Record<string, jest.Mock>;
  let mockComplianceService: Partial<ComplianceService>;
  let mockRedisService: Partial<RedisService>;
  let mockDataSource: Partial<DataSource>;
  let mockZonesService: Partial<ZonesService>;

  // Visakhapatnam Urban Test Boundary: [83.25 - 83.35 Lon, 17.68 - 17.76 Lat]
  const testZonePolygon: GeoJsonPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [83.25, 17.68],
        [83.35, 17.68],
        [83.35, 17.76],
        [83.25, 17.76],
        [83.25, 17.68],
      ],
    ],
  };

  const activeTestZone: Partial<Zone> = {
    id: 'z0420000-0000-4000-8000-000000000001',
    code: 'ZONE-VIZAG-URBAN',
    name: 'Visakhapatnam Urban Pilot Zone',
    city: 'visakhapatnam',
    operationalStatus: 'ACTIVE',
    isActive: true,
    boundary: testZonePolygon,
    categorySwitches: {
      CITY_COMMUTE_2W: true,
      AUTO_COMMUTE_3W: true,
      CAB_PRIVATE_4W: true,
      VAN_COMMUTE_4W: false, // Disabled van category
    },
  };

  function createTestVehicle(overrides?: Partial<Vehicle>): Vehicle {
    const v = new Vehicle();
    v.id = 'v0420000-0000-4000-8000-000000000001';
    v.registrationNumber = 'AP39-EV-0001';
    v.propulsionType = PropulsionType.BATTERY_ELECTRIC;
    v.vehicleCategory = VehicleCategory.CAB_PRIVATE_4W;
    v.serviceClass = VehicleServiceClass.ECO_CAB;
    v.approvedPassengerSeating = 4;
    v.totalSeatingCapacity = 5;
    v.batteryCapacityKwh = 40.0;
    v.currentSocPercent = 85.0;
    v.ratedRangeKm = 300;
    v.rangeTelemetrySource = 'OBD_TELEMATICS';
    v.greenPlateVerified = true;
    v.verificationStatus = VehicleVerificationStatus.VERIFIED;
    v.isActive = true;
    v.insuranceExpiryDate = new Date(Date.now() + 180 * 86400000);
    v.fitnessExpiryDate = new Date(Date.now() + 180 * 86400000);
    v.commercialPermitExpiry = new Date(Date.now() + 180 * 86400000);
    v.city = 'visakhapatnam';
    return Object.assign(v, overrides);
  }

  function createTestDriver(
    id: string,
    name: string,
    overrides?: Partial<DriverProfile>,
    vehicleOverrides?: Partial<Vehicle>,
  ): DriverProfile {
    const dp = new DriverProfile();
    dp.id = id;
    dp.userId = `user-${id}`;
    dp.licenseNumber = `AP39-LIC-${id.substring(0, 4)}`;
    dp.verificationStatus = DriverComplianceStatus.VERIFIED;
    dp.dutyStatus = DutyStatus.ONLINE;
    dp.availabilityStatus = CaptainAvailabilityStatus.AVAILABLE;
    dp.greenPlatePermitVerified = true;
    dp.safetyTrainingCompleted = true;
    dp.ratingAverage = 4.8;
    dp.totalTrips = 50;
    dp.city = 'visakhapatnam';
    dp.currentLatitude = 17.7271; // RTC Complex (inside zone)
    dp.currentLongitude = 83.3039;
    dp.locationAccuracyMeters = 8.0; // High precision <= 50m
    dp.locationUpdatedAt = new Date(); // Fresh <= 30s
    dp.batterySocPercent = 85.0;
    dp.lastStatusChangedAt = new Date(Date.now() - 30 * 60000); // 30 mins idle
    dp.createdAt = new Date();
    dp.updatedAt = new Date();

    const u = new User();
    u.id = dp.userId;
    u.name = name;
    dp.user = u;

    dp.assignedVehicle = createTestVehicle(vehicleOverrides);
    dp.assignedVehicleId = dp.assignedVehicle.id;

    return Object.assign(dp, overrides);
  }

  beforeEach(async () => {
    mockDriverProfileRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    mockLocationPingRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    mockZoneRepository = {
      find: jest.fn().mockResolvedValue([activeTestZone]),
      findOne: jest.fn().mockResolvedValue(activeTestZone),
    };

    mockComplianceService = {
      calculateEligibility: jest.fn().mockResolvedValue({
        isEligibleForAssignment: true,
        ineligibilityReasons: [],
      }),
    };

    mockRedisService = {
      getClient: jest.fn().mockReturnValue(null), // Redis offline by default
    };

    mockDataSource = {
      query: jest.fn().mockRejectedValue(new Error('PostGIS query fallback to in-memory')),
    };

    mockZonesService = {
      verifyLocation: jest.fn().mockResolvedValue({
        isAuthorized: true,
        isInsideGeofence: true,
        zoneId: activeTestZone.id,
        zoneCode: activeTestZone.code,
        zoneName: activeTestZone.name,
        city: 'visakhapatnam',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptainAvailabilityService,
        {
          provide: getRepositoryToken(DriverProfile),
          useValue: mockDriverProfileRepository,
        },
        {
          provide: getRepositoryToken(CaptainLocationPing),
          useValue: mockLocationPingRepository,
        },
        {
          provide: getRepositoryToken(Zone),
          useValue: mockZoneRepository,
        },
        {
          provide: ComplianceService,
          useValue: mockComplianceService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ZonesService,
          useValue: mockZonesService,
        },
      ],
    }).compile();

    service = module.get<CaptainAvailabilityService>(CaptainAvailabilityService);
  });

  describe('1. Positive Candidate Selection & Deterministic Fair Offer Ordering', () => {
    it('should select eligible captains within radius and apply BALANCED_FAIR ranking', async () => {
      // Captain A: 500m away, 10 mins idle, rating 4.9, 90% SoC
      const captainA = createTestDriver('c001', 'Captain Alice', {
        currentLatitude: 17.728,
        currentLongitude: 83.305,
        lastStatusChangedAt: new Date(Date.now() - 10 * 60000),
        ratingAverage: 4.9,
        batterySocPercent: 90.0,
      });

      // Captain B: 2.5km away, 50 mins idle, rating 4.7, 75% SoC
      const captainB = createTestDriver('c002', 'Captain Bob', {
        currentLatitude: 17.74,
        currentLongitude: 83.32,
        lastStatusChangedAt: new Date(Date.now() - 50 * 60000),
        ratingAverage: 4.7,
        batterySocPercent: 75.0,
      });

      mockDriverProfileRepository.find.mockResolvedValue([captainA, captainB]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
        serviceCategory: 'ECO_CAB',
        radiusKm: 5.0,
        rankingStrategy: RankingStrategy.BALANCED_FAIR,
      });

      expect(result.candidates).toHaveLength(2);
      expect(result.zone?.code).toBe('ZONE-VIZAG-URBAN');
      expect(result.candidates[0].rank).toBe(1);
      expect(result.candidates[1].rank).toBe(2);

      // Verify all candidate attributes are populated accurately
      const first = result.candidates[0];
      expect(first.captainId).toBe('c001');
      expect(first.distanceMeters).toBeLessThan(1000);
      expect(first.fairScore).toBeGreaterThan(0);
      expect(first.estimatedEtaMinutes).toBeGreaterThanOrEqual(1);
      expect(first.practicalRangeKm).toBeGreaterThan(100);
    });

    it('should prioritize idle waiting time under FAIR_ROTATION strategy to prevent driver starvation', async () => {
      // Captain A: Very close (200m away), but came online only 2 minutes ago
      const captainA = createTestDriver('c001', 'Captain Alice (New Online)', {
        currentLatitude: 17.7275,
        currentLongitude: 83.3042,
        lastStatusChangedAt: new Date(Date.now() - 2 * 60000), // 2 mins idle
        ratingAverage: 4.8,
      });

      // Captain B: 1.5km away (nearby), but has been waiting 55 minutes without a trip
      const captainB = createTestDriver('c002', 'Captain Bob (Long Wait FIFO)', {
        currentLatitude: 17.735,
        currentLongitude: 83.312,
        lastStatusChangedAt: new Date(Date.now() - 55 * 60000), // 55 mins idle
        ratingAverage: 4.8,
      });

      mockDriverProfileRepository.find.mockResolvedValue([captainA, captainB]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
        serviceCategory: 'ECO_CAB',
        rankingStrategy: RankingStrategy.FAIR_ROTATION,
      });

      expect(result.candidates).toHaveLength(2);
      // Under FAIR_ROTATION, Captain Bob with 55 mins idle waiting time takes Rank 1
      expect(result.candidates[0].captainId).toBe('c002');
      expect(result.candidates[0].idleMinutes).toBeGreaterThanOrEqual(54);
      expect(result.candidates[1].captainId).toBe('c001');
    });

    it('should prioritize pure distance under PROXIMITY strategy', async () => {
      const captainA = createTestDriver('c001', 'Captain Alice (Close)', {
        currentLatitude: 17.7275,
        currentLongitude: 83.3042, // ~100m away
        lastStatusChangedAt: new Date(Date.now() - 2 * 60000),
      });

      const captainB = createTestDriver('c002', 'Captain Bob (Far)', {
        currentLatitude: 17.745,
        currentLongitude: 83.325, // ~3km away
        lastStatusChangedAt: new Date(Date.now() - 60 * 60000),
      });

      mockDriverProfileRepository.find.mockResolvedValue([captainA, captainB]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
        serviceCategory: 'ECO_CAB',
        rankingStrategy: RankingStrategy.PROXIMITY,
      });

      expect(result.candidates[0].captainId).toBe('c001');
      expect(result.candidates[0].distanceMeters).toBeLessThan(result.candidates[1].distanceMeters);
    });
  });

  describe('2. Negative Tests — Non-EV Exclusion', () => {
    it('should NEVER include captain with non-electric (ICE/Hybrid/Petrol/Diesel) vehicle', async () => {
      const petrolCaptain = createTestDriver(
        'c-petrol',
        'Petrol Captain',
        {},
        { propulsionType: 'PETROL' as unknown as Vehicle['propulsionType'] },
      );
      const dieselCaptain = createTestDriver(
        'c-diesel',
        'Diesel Captain',
        {},
        { propulsionType: 'DIESEL' as unknown as Vehicle['propulsionType'] },
      );
      const hybridCaptain = createTestDriver(
        'c-hybrid',
        'Hybrid Captain',
        {},
        { propulsionType: 'HYBRID' as unknown as Vehicle['propulsionType'] },
      );

      mockDriverProfileRepository.find.mockResolvedValue([
        petrolCaptain,
        dieselCaptain,
        hybridCaptain,
      ]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER include captain with unverified, inactive, or green-plate missing vehicle', async () => {
      const unverifiedVehicleCaptain = createTestDriver(
        'c-unverified-v',
        'Unverified Vehicle Captain',
        {},
        { verificationStatus: VehicleVerificationStatus.PENDING_VERIFICATION },
      );
      const inactiveVehicleCaptain = createTestDriver(
        'c-inactive-v',
        'Inactive Vehicle Captain',
        {},
        { isActive: false },
      );
      const noGreenPlateCaptain = createTestDriver(
        'c-no-green',
        'No Green Plate Captain',
        {},
        { greenPlateVerified: false },
      );

      mockDriverProfileRepository.find.mockResolvedValue([
        unverifiedVehicleCaptain,
        inactiveVehicleCaptain,
        noGreenPlateCaptain,
      ]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER include captain when vehicle statutory roadworthiness documents are expired', async () => {
      const expiredInsuranceCaptain = createTestDriver(
        'c-expired-ins',
        'Expired Insurance Captain',
        {},
        { insuranceExpiryDate: new Date(Date.now() - 2 * 86400000) }, // Expired 2 days ago
      );

      mockDriverProfileRepository.find.mockResolvedValue([expiredInsuranceCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER include captain without an assigned vehicle', async () => {
      const unassignedCaptain = createTestDriver('c-no-vehicle', 'No Vehicle Captain');
      unassignedCaptain.assignedVehicle = undefined;
      unassignedCaptain.assignedVehicleId = undefined;

      mockDriverProfileRepository.find.mockResolvedValue([unassignedCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('3. Negative Tests — Suspended & Incomplete KYC Exclusion', () => {
    it('should NEVER include captain with SUSPENDED or REJECTED verification status', async () => {
      const suspendedCaptain = createTestDriver('c-suspended', 'Suspended Captain', {
        verificationStatus: DriverComplianceStatus.SUSPENDED,
      });
      const rejectedCaptain = createTestDriver('c-rejected', 'Rejected Captain', {
        verificationStatus: DriverComplianceStatus.REJECTED,
      });
      const pendingCaptain = createTestDriver('c-pending', 'Pending Captain', {
        verificationStatus: DriverComplianceStatus.PENDING,
      });

      mockDriverProfileRepository.find.mockResolvedValue([
        suspendedCaptain,
        rejectedCaptain,
        pendingCaptain,
      ]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER include captain without verified green plate permit or safety training', async () => {
      const noPermitCaptain = createTestDriver('c-no-permit', 'No Permit Captain', {
        greenPlatePermitVerified: false,
      });
      const noTrainingCaptain = createTestDriver('c-no-training', 'No Training Captain', {
        safetyTrainingCompleted: false,
      });

      mockDriverProfileRepository.find.mockResolvedValue([noPermitCaptain, noTrainingCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('4. Negative Tests — Occupied & Off-duty Exclusion', () => {
    it('should NEVER include captain who is ON_TRIP, RESERVED, CHARGING, MAINTENANCE, or OFFLINE', async () => {
      const onTripCaptain = createTestDriver('c-on-trip', 'On Trip Captain', {
        availabilityStatus: CaptainAvailabilityStatus.ON_TRIP,
        dutyStatus: DutyStatus.ON_TRIP,
      });
      const reservedCaptain = createTestDriver('c-reserved', 'Reserved Captain', {
        availabilityStatus: CaptainAvailabilityStatus.RESERVED,
      });
      const chargingCaptain = createTestDriver('c-charging', 'Charging Captain', {
        availabilityStatus: CaptainAvailabilityStatus.CHARGING,
      });
      const maintenanceCaptain = createTestDriver('c-maintenance', 'Maintenance Captain', {
        availabilityStatus: CaptainAvailabilityStatus.MAINTENANCE,
      });
      const offlineCaptain = createTestDriver('c-offline', 'Offline Captain', {
        availabilityStatus: CaptainAvailabilityStatus.OFFLINE,
        dutyStatus: DutyStatus.OFFLINE,
      });

      mockDriverProfileRepository.find.mockResolvedValue([
        onTripCaptain,
        reservedCaptain,
        chargingCaptain,
        maintenanceCaptain,
        offlineCaptain,
      ]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('5. Negative Tests — Outside-Zone Exclusion', () => {
    it('should NEVER include captain located outside authorized service zone polygon', async () => {
      // Captain located outside Visakhapatnam Urban Zone polygon [83.25 - 83.35, 17.68 - 17.76]
      // Lat 17.55, Lon 83.10 is well outside the boundary polygon
      const outsideCaptain = createTestDriver('c-outside', 'Outside Zone Captain', {
        currentLatitude: 17.55,
        currentLongitude: 83.1,
      });

      mockDriverProfileRepository.find.mockResolvedValue([outsideCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should return 0 candidates when pickup location itself is outside all authorized service zones', async () => {
      const eligibleCaptain = createTestDriver('c-eligible', 'Inside Captain');
      mockDriverProfileRepository.find.mockResolvedValue([eligibleCaptain]);

      // Mock pickup location outside all authorized zones
      mockZoneRepository.find.mockResolvedValue([]);
      if (mockZonesService) {
        mockZonesService.verifyLocation = jest.fn().mockResolvedValue({
          isAuthorized: false,
          isInsideGeofence: false,
          operationalStatus: 'NONE',
        });
      }

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 18.25, // Outside pilot boundaries
        pickupLongitude: 84.1,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
      expect(result.zone).toBeNull();
    });
  });

  describe('6. Negative Tests — Service Category & Seating Compatibility', () => {
    it('should NEVER include captain with incompatible vehicle category (e.g. 2W when 4W requested)', async () => {
      const bikeCaptain = createTestDriver(
        'c-bike',
        '2W Bike Captain',
        {},
        {
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          serviceClass: VehicleServiceClass.ECO_BIKE,
          approvedPassengerSeating: 1,
        },
      );

      mockDriverProfileRepository.find.mockResolvedValue([bikeCaptain]);

      // Rider requested 4W Private Cab
      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
        serviceCategory: VehicleServiceClass.ECO_CAB,
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER include captain with insufficient legal seating capacity (requested 3 seats, vehicle has 1)', async () => {
      const bikeCaptain = createTestDriver(
        'c-bike-single',
        'Single Seat Captain',
        {},
        { approvedPassengerSeating: 1 },
      );

      mockDriverProfileRepository.find.mockResolvedValue([bikeCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
        requestedSeats: 3, // Requires at least 3 seats
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER return candidates if requested category is disabled in zone switches (VAN_COMMUTE_4W: false)', async () => {
      const vanCaptain = createTestDriver(
        'c-van',
        'Van Captain',
        {},
        {
          vehicleCategory: VehicleCategory.VAN_COMMUTE_4W,
          serviceClass: VehicleServiceClass.ECO_VAN,
          approvedPassengerSeating: 7,
        },
      );

      mockDriverProfileRepository.find.mockResolvedValue([vanCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
        serviceCategory: VehicleCategory.VAN_COMMUTE_4W, // Disabled in activeTestZone
      });

      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('7. Negative Tests — Location Precision & Telemetry Freshness Controls', () => {
    it('should NEVER include captain with degraded GPS accuracy (> 50.0m tolerance)', async () => {
      const degradedCaptain = createTestDriver('c-degraded-gps', 'Degraded GPS Captain', {
        locationAccuracyMeters: 75.0, // Exceeds 50m tolerance
      });

      mockDriverProfileRepository.find.mockResolvedValue([degradedCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER include captain with stale location telemetry (> 30-second TTL)', async () => {
      const staleCaptain = createTestDriver('c-stale-loc', 'Stale Location Captain', {
        locationUpdatedAt: new Date(Date.now() - 45 * 1000), // 45 seconds old > 30s
      });

      mockDriverProfileRepository.find.mockResolvedValue([staleCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });

    it('should NEVER include captain with battery State of Charge below 20% minimum buffer', async () => {
      const lowBatteryCaptain = createTestDriver(
        'c-low-battery',
        'Low Battery Captain',
        { batterySocPercent: 14.0 },
        { currentSocPercent: 14.0 },
      );

      mockDriverProfileRepository.find.mockResolvedValue([lowBatteryCaptain]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('8. Redis Transient Pre-Filtering & Offline Resilience', () => {
    it('should execute georadius on Redis when client is connected', async () => {
      const mockRedisClient = {
        status: 'ready',
        georadius: jest.fn().mockResolvedValue(['user-c001', 'user-c002']),
      };
      mockRedisService.getClient = jest.fn().mockReturnValue(mockRedisClient);

      const captainA = createTestDriver('c001', 'Captain Alice');
      mockDriverProfileRepository.find.mockResolvedValue([captainA]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      expect(mockRedisClient.georadius).toHaveBeenCalled();
      expect(result.candidates).toHaveLength(1);
    });

    it('should seamlessly fall back to authoritative database/repository when Redis throws or is offline', async () => {
      const mockBrokenRedis = {
        status: 'ready',
        georadius: jest.fn().mockRejectedValue(new Error('Redis connection timed out')),
      };
      mockRedisService.getClient = jest.fn().mockReturnValue(mockBrokenRedis);

      const captainA = createTestDriver('c001', 'Captain Alice');
      mockDriverProfileRepository.find.mockResolvedValue([captainA]);

      const result = await service.selectNearbyEligibleCaptains({
        pickupLatitude: 17.7271,
        pickupLongitude: 83.3039,
        city: 'visakhapatnam',
      });

      // Operates resiliently without bubbling Redis error
      expect(result.candidates).toHaveLength(1);
    });
  });
});
