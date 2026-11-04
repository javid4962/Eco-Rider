import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CaptainAvailabilityStatus,
  DutyStatus,
  DriverComplianceStatus,
  PlatformRole,
} from '@ecoride/contracts';
import { CaptainAvailabilityService } from '../src/modules/compliance/captain-availability.service';
import { ComplianceService } from '../src/modules/compliance/compliance.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';
import { CaptainLocationPing } from '../src/database/entities/captain-location-ping.entity';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('CaptainAvailabilityService (EV-040 Unit Specs)', () => {
  let service: CaptainAvailabilityService;
  let mockDriverProfileRepository: Record<string, jest.Mock>;
  let mockLocationPingRepository: Record<string, jest.Mock>;
  let mockComplianceService: Partial<ComplianceService>;
  let mockRedisService: Partial<RedisService>;
  let mockDataSource: Partial<DataSource>;

  const captainAliceUserId = 'a0400000-0000-4000-8000-000000000001';
  const captainBobUserId = 'b0400000-0000-4000-8000-000000000002';
  const driverProfileAliceId = 'd0400000-0000-4000-8000-000000000001';

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

  function createTestDriverProfile(overrides?: Partial<DriverProfile>): DriverProfile {
    const profile = new DriverProfile();
    profile.id = driverProfileAliceId;
    profile.userId = captainAliceUserId;
    profile.licenseNumber = 'AP39-2026-0001';
    profile.verificationStatus = DriverComplianceStatus.VERIFIED;
    profile.dutyStatus = DutyStatus.OFFLINE;
    profile.availabilityStatus = CaptainAvailabilityStatus.OFFLINE;
    profile.greenPlatePermitVerified = true;
    profile.safetyTrainingCompleted = true;
    profile.ratingAverage = 4.9;
    profile.totalTrips = 42;
    profile.city = 'visakhapatnam';
    profile.batterySocPercent = 85.0;
    profile.currentLatitude = 17.7126;
    profile.currentLongitude = 83.3174;
    profile.locationAccuracyMeters = 10.0;
    profile.locationUpdatedAt = new Date();
    profile.lastStatusChangedAt = new Date();
    profile.createdAt = new Date();
    profile.updatedAt = new Date();

    return Object.assign(profile, overrides);
  }

  beforeEach(async () => {
    mockDriverProfileRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockLocationPingRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockComplianceService = {
      calculateEligibility: jest.fn().mockResolvedValue({
        isEligibleForAssignment: true,
        ineligibilityReasons: [],
      }),
    };

    mockRedisService = {
      getClient: jest.fn().mockReturnValue(null),
    };

    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
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
      ],
    }).compile();

    service = module.get<CaptainAvailabilityService>(CaptainAvailabilityService);
  });

  describe('updateAvailability — Lifecycle State Transitions', () => {
    it('allows captain to transition to AVAILABLE when verified and compliant', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.OFFLINE,
        dutyStatus: DutyStatus.OFFLINE,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const result = await service.updateAvailability(actorAlice, captainAliceUserId, {
        status: CaptainAvailabilityStatus.AVAILABLE,
        batterySocPercent: 90.0,
      });

      expect(result.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      expect(result.dutyStatus).toBe(DutyStatus.ONLINE);
      expect(profile.batterySocPercent).toBe(90.0);
      expect(mockComplianceService.calculateEligibility).toHaveBeenCalledWith(captainAliceUserId);
    });

    it('rejects transition to AVAILABLE if captain compliance is not eligible', async () => {
      const profile = createTestDriverProfile({
        verificationStatus: DriverComplianceStatus.PENDING,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);
      mockComplianceService.calculateEligibility = jest.fn().mockResolvedValue({
        isEligibleForAssignment: false,
        ineligibilityReasons: ['Mandatory EV safety training not completed.'],
      });

      await expect(
        service.updateAvailability(actorAlice, captainAliceUserId, {
          status: CaptainAvailabilityStatus.AVAILABLE,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('supports transitioning to CHARGING state with depot reason note', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
        dutyStatus: DutyStatus.ONLINE,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const result = await service.updateAvailability(actorAlice, captainAliceUserId, {
        status: CaptainAvailabilityStatus.CHARGING,
        reason: 'DC Fast Charging at MVP Colony Depot',
        batterySocPercent: 32.0,
      });

      expect(result.availabilityStatus).toBe(CaptainAvailabilityStatus.CHARGING);
      expect(profile.statusReason).toBe('DC Fast Charging at MVP Colony Depot');
      expect(profile.batterySocPercent).toBe(32.0);
    });

    it('supports transitioning to MAINTENANCE state', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const result = await service.updateAvailability(actorAlice, captainAliceUserId, {
        status: CaptainAvailabilityStatus.MAINTENANCE,
        reason: 'Brake pad and tyre pressure inspection',
      });

      expect(result.availabilityStatus).toBe(CaptainAvailabilityStatus.MAINTENANCE);
      expect(profile.statusReason).toBe('Brake pad and tyre pressure inspection');
    });

    it('supports transitioning to RESERVED, ON_TRIP, and OFFLINE', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      // 1. Reserved
      const reservedRes = await service.updateAvailability(actorAlice, captainAliceUserId, {
        status: CaptainAvailabilityStatus.RESERVED,
      });
      expect(reservedRes.availabilityStatus).toBe(CaptainAvailabilityStatus.RESERVED);

      // 2. On Trip
      const onTripRes = await service.updateAvailability(actorAlice, captainAliceUserId, {
        status: CaptainAvailabilityStatus.ON_TRIP,
      });
      expect(onTripRes.availabilityStatus).toBe(CaptainAvailabilityStatus.ON_TRIP);
      expect(profile.dutyStatus).toBe(DutyStatus.ON_TRIP);

      // 3. Offline
      const offlineRes = await service.updateAvailability(actorAlice, captainAliceUserId, {
        status: CaptainAvailabilityStatus.OFFLINE,
      });
      expect(offlineRes.availabilityStatus).toBe(CaptainAvailabilityStatus.OFFLINE);
      expect(profile.dutyStatus).toBe(DutyStatus.OFFLINE);
    });

    it('strictly forbids client from editing another captain availability state', async () => {
      // Bob attempts to edit Alice's state
      await expect(
        service.updateAvailability(actorBob, captainAliceUserId, {
          status: CaptainAvailabilityStatus.AVAILABLE,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockDriverProfileRepository.findOne).not.toHaveBeenCalled();
    });

    it('allows admin / ops to manage another captain availability state', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const result = await service.updateAvailability(actorAdmin, captainAliceUserId, {
        status: CaptainAvailabilityStatus.MAINTENANCE,
        reason: 'Safety compliance inspection ordered by dispatch desk',
      });

      expect(result.availabilityStatus).toBe(CaptainAvailabilityStatus.MAINTENANCE);
    });
  });

  describe('recordLocationPing — Accuracy & Ingestion Safeguards', () => {
    it('ingests valid location ping and marks as fresh within 30-second window', async () => {
      const profile = createTestDriverProfile();
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const locationDto = await service.recordLocationPing(actorAlice, captainAliceUserId, {
        latitude: 17.723,
        longitude: 83.301,
        accuracyMeters: 8.5,
        headingDegrees: 180.0,
        speedKmph: 35.0,
        altitudeMeters: 14.2,
        batterySocPercent: 78.0,
      });

      expect(locationDto.latitude).toBe(17.723);
      expect(locationDto.longitude).toBe(83.301);
      expect(locationDto.accuracyMeters).toBe(8.5);
      expect(locationDto.isFresh).toBe(true);
      expect(locationDto.ageSeconds).toBeLessThanOrEqual(5);
      expect(profile.batterySocPercent).toBe(78.0);
    });

    it('rejects location ping with unacceptable accuracy (> 500m or negative)', async () => {
      const profile = createTestDriverProfile();
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      await expect(
        service.recordLocationPing(actorAlice, captainAliceUserId, {
          latitude: 17.723,
          longitude: 83.301,
          accuracyMeters: 650.0, // > 500m unacceptable
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.recordLocationPing(actorAlice, captainAliceUserId, {
          latitude: 17.723,
          longitude: 83.301,
          accuracyMeters: -5.0, // negative unacceptable
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('strictly forbids client from recording location for another captain', async () => {
      // Bob attempts to emit location for Alice
      await expect(
        service.recordLocationPing(actorBob, captainAliceUserId, {
          latitude: 17.723,
          longitude: 83.301,
          accuracyMeters: 10.0,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDispatchEligibility — Acceptance / Demonstration Rules', () => {
    it('returns eligible for dispatch when AVAILABLE, fresh location, accurate GPS, and battery >= 20%', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
        locationUpdatedAt: new Date(Date.now() - 5000), // 5 seconds ago (fresh)
        locationAccuracyMeters: 12.0, // <= 50m
        batterySocPercent: 65.0, // >= 20%
        verificationStatus: DriverComplianceStatus.VERIFIED,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const eligibility = await service.getDispatchEligibility(actorAlice, captainAliceUserId);

      expect(eligibility.isEligibleForDispatch).toBe(true);
      expect(eligibility.isLocationFresh).toBe(true);
      expect(eligibility.isAccuracyAcceptable).toBe(true);
      expect(eligibility.isBatterySufficient).toBe(true);
      expect(eligibility.ineligibilityReasons).toHaveLength(0);
    });

    it('demonstrates that OFFLINE captains cannot receive dispatch offers', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.OFFLINE,
        locationUpdatedAt: new Date(Date.now() - 5000),
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const eligibility = await service.getDispatchEligibility(actorAlice, captainAliceUserId);

      expect(eligibility.isEligibleForDispatch).toBe(false);
      expect(eligibility.ineligibilityReasons).toContain('Captain is currently OFFLINE.');
    });

    it('demonstrates that CHARGING captains cannot receive dispatch offers', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.CHARGING,
        locationUpdatedAt: new Date(Date.now() - 5000),
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const eligibility = await service.getDispatchEligibility(actorAlice, captainAliceUserId);

      expect(eligibility.isEligibleForDispatch).toBe(false);
      expect(eligibility.ineligibilityReasons).toContain(
        'Captain EV is actively CHARGING / battery swapping.',
      );
    });

    it('demonstrates that MAINTENANCE captains cannot receive dispatch offers', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.MAINTENANCE,
        locationUpdatedAt: new Date(Date.now() - 5000),
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const eligibility = await service.getDispatchEligibility(actorAlice, captainAliceUserId);

      expect(eligibility.isEligibleForDispatch).toBe(false);
      expect(eligibility.ineligibilityReasons).toContain(
        'Captain vehicle is undergoing MAINTENANCE.',
      );
    });

    it('demonstrates that STALE location captains (> 30s) cannot receive dispatch offers', async () => {
      const staleTime = new Date(Date.now() - 45000); // 45s ago (> 30s freshness threshold)
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
        locationUpdatedAt: staleTime,
        locationAccuracyMeters: 10.0,
        batterySocPercent: 80.0,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const eligibility = await service.getDispatchEligibility(actorAlice, captainAliceUserId);

      expect(eligibility.isEligibleForDispatch).toBe(false);
      expect(eligibility.isLocationFresh).toBe(false);
      expect(eligibility.locationAgeSeconds).toBeGreaterThanOrEqual(40);
      expect(
        eligibility.ineligibilityReasons.some((r) => r.includes('Location telemetry is stale')),
      ).toBe(true);
    });

    it('demonstrates that captains with degraded GPS accuracy (> 50m) cannot receive dispatch offers', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
        locationUpdatedAt: new Date(),
        locationAccuracyMeters: 85.0, // > 50m
        batterySocPercent: 80.0,
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const eligibility = await service.getDispatchEligibility(actorAlice, captainAliceUserId);

      expect(eligibility.isEligibleForDispatch).toBe(false);
      expect(eligibility.isAccuracyAcceptable).toBe(false);
      expect(
        eligibility.ineligibilityReasons.some((r) =>
          r.includes('Location accuracy (85m) exceeds maximum 50m tolerance'),
        ),
      ).toBe(true);
    });

    it('demonstrates that captains with low battery (< 20% SoC) cannot receive dispatch offers', async () => {
      const profile = createTestDriverProfile({
        availabilityStatus: CaptainAvailabilityStatus.AVAILABLE,
        locationUpdatedAt: new Date(),
        locationAccuracyMeters: 10.0,
        batterySocPercent: 14.5, // < 20% SoC buffer
      });
      mockDriverProfileRepository.findOne.mockResolvedValue(profile);

      const eligibility = await service.getDispatchEligibility(actorAlice, captainAliceUserId);

      expect(eligibility.isEligibleForDispatch).toBe(false);
      expect(eligibility.isBatterySufficient).toBe(false);
      expect(
        eligibility.ineligibilityReasons.some((r) =>
          r.includes('below mandatory 20% safety buffer'),
        ),
      ).toBe(true);
    });

    it('strictly forbids client from inspecting another captain dispatch eligibility', async () => {
      // Bob attempts to inspect Alice's eligibility
      await expect(service.getDispatchEligibility(actorBob, captainAliceUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
