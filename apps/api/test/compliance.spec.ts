import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import {
  ComplianceService,
  calculateDaysRemainingToLocalBoundary,
  determineWarningTier,
} from '../src/modules/compliance/compliance.service';
import {
  DriverProfile,
  CaptainApplication,
  Vehicle,
  AuditEvent,
  ComplianceWarning,
  Document,
} from '../src/database/entities';
import { IdentityService } from '../src/modules/identity/identity.service';
import { ReleaseBoundariesService } from '../src/modules/release-boundaries/release-boundaries.service';
import {
  DriverComplianceStatus,
  DutyStatus,
  PropulsionType,
  VehicleVerificationStatus,
  PlatformRole,
  CaptainApplicationStatus,
  ComplianceWarningTier,
  DocumentStatus,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('ComplianceService (EV-025)', () => {
  let service: ComplianceService;
  let driverProfileRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  let captainAppRepo: {
    findOne: jest.Mock;
  };
  let complianceWarningRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let vehicleRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let documentRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let identityService: {
    assertCanAccessUser: jest.Mock;
    recordAuditEvent: jest.Mock;
  };
  let releaseBoundariesService: {
    evaluate: jest.Mock;
  };

  const mockCaptainActor: CurrentActorPayload = {
    id: '11111111-1111-4111-8111-111111111111',
    role: PlatformRole.CAPTAIN,
    scopes: ['driver:self'],
    ipAddress: '127.0.0.1',
    correlationId: 'trace-test-1',
  };

  const mockOperatorActor: CurrentActorPayload = {
    id: '99999999-9999-4999-8999-999999999999',
    role: PlatformRole.OPERATOR,
    scopes: ['driver:read', 'driver:write', '*'],
    ipAddress: '127.0.0.1',
    correlationId: 'trace-test-op',
  };

  const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const createMockVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => {
    const v = new Vehicle();
    v.id = 'v1000000-0000-4000-8000-000000000001';
    v.registrationNumber = 'AP31EV1234';
    v.propulsionType = PropulsionType.BATTERY_ELECTRIC;
    v.verificationStatus = VehicleVerificationStatus.VERIFIED;
    v.greenPlateVerified = true;
    v.isActive = true;
    v.currentSocPercent = 90.0;
    v.ratedRangeKm = 120;
    v.insuranceExpiryDate = futureDate;
    v.fitnessExpiryDate = futureDate;
    v.commercialPermitExpiry = futureDate;
    return Object.assign(v, overrides);
  };

  const createMockDriverProfile = (overrides: Partial<DriverProfile> = {}): DriverProfile => {
    const dp = new DriverProfile();
    dp.id = 'dp100000-0000-4000-8000-000000000001';
    dp.userId = mockCaptainActor.id;
    dp.licenseNumber = 'AP31 20240001122';
    dp.badgeNumber = 'BDG-AP-990';
    dp.verificationStatus = DriverComplianceStatus.VERIFIED;
    dp.dutyStatus = DutyStatus.OFFLINE;
    dp.licenseExpiryDate = futureDate;
    dp.greenPlatePermitVerified = true;
    dp.safetyTrainingCompleted = true;
    dp.city = 'visakhapatnam';
    dp.assignedVehicleId = 'v1000000-0000-4000-8000-000000000001';
    dp.assignedVehicle = createMockVehicle();
    dp.dutyLastToggledAt = null;
    dp.suspensionReason = null;
    dp.complianceNotes = null;
    dp.ratingAverage = 5.0;
    dp.totalTrips = 45;
    return Object.assign(dp, overrides);
  };

  const createMockCaptainApplication = (
    overrides: Partial<CaptainApplication> = {},
  ): CaptainApplication => {
    const app = new CaptainApplication();
    app.id = 'app10000-0000-4000-8000-000000000001';
    app.userId = mockCaptainActor.id;
    app.status = CaptainApplicationStatus.APPROVED;
    app.fullName = 'Venkata Ramana';
    app.drivingLicenseNumber = 'AP31 20240001122';
    app.drivingLicenseDocId = 'doc-lic-1';
    app.aadhaarDocId = 'doc-adh-1';
    app.vehicleRegistrationNumber = 'AP31EV1234';
    app.vehicleRcDocId = 'doc-rc-1';
    app.greenPlatePermitDocId = 'doc-perm-1';
    app.propulsionType = PropulsionType.BATTERY_ELECTRIC;
    return Object.assign(app, overrides);
  };

  beforeEach(async () => {
    driverProfileRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((profile) => Promise.resolve(profile)),
    };

    captainAppRepo = {
      findOne: jest.fn(),
    };

    complianceWarningRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockImplementation((dto) => ({ id: 'w-uuid-1', ...dto, createdAt: new Date() })),
      save: jest.fn().mockImplementation((w) => Promise.resolve({ id: 'w-uuid-1', ...w })),
    };

    vehicleRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
      count: jest.fn().mockResolvedValue(1),
    };

    documentRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    identityService = {
      assertCanAccessUser: jest.fn().mockResolvedValue(undefined),
      recordAuditEvent: jest.fn().mockResolvedValue(new AuditEvent()),
    };

    releaseBoundariesService = {
      evaluate: jest.fn().mockReturnValue({
        allowed: true,
        city: 'visakhapatnam',
        serviceCategory: 'private_ev',
        releasePhase: 'RELEASE_A_PILOT',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: getRepositoryToken(DriverProfile),
          useValue: driverProfileRepo,
        },
        {
          provide: getRepositoryToken(CaptainApplication),
          useValue: captainAppRepo,
        },
        {
          provide: getRepositoryToken(ComplianceWarning),
          useValue: complianceWarningRepo,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: vehicleRepo,
        },
        {
          provide: getRepositoryToken(Document),
          useValue: documentRepo,
        },
        {
          provide: IdentityService,
          useValue: identityService,
        },
        {
          provide: ReleaseBoundariesService,
          useValue: releaseBoundariesService,
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  describe('1. Compliance Eligibility Calculation & Separation from Draft', () => {
    it('should confirm that a verified and complete captain is NOT mislabeled draft', async () => {
      driverProfileRepo.findOne.mockResolvedValue(createMockDriverProfile());
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const res = await service.calculateEligibility(mockCaptainActor.id);

      // Acceptance: Verified captain is not mislabeled draft
      expect(res.complianceStatus).toBe(DriverComplianceStatus.VERIFIED);
      expect(res.isDraftComplete).toBe(true);
      expect(res.complianceStatus).not.toBe('DRAFT');
      expect(res.isEligibleForAssignment).toBe(true);
      expect(res.ineligibilityReasons).toHaveLength(0);
      expect(res.approvalDetails.driverApproved).toBe(true);
      expect(res.approvalDetails.vehicleApproved).toBe(true);
      expect(res.documentValidity.licenseValid).toBe(true);
      expect(res.documentValidity.vehicleRoadworthy).toBe(true);
    });

    it('should flag captain as incomplete if onboarding application draft lacks required documents', async () => {
      driverProfileRepo.findOne.mockResolvedValue(createMockDriverProfile());
      // Incomplete draft: missing drivingLicenseDocId and greenPlatePermitDocId
      captainAppRepo.findOne.mockResolvedValue(
        createMockCaptainApplication({
          status: CaptainApplicationStatus.DRAFT,
          drivingLicenseDocId: null as unknown as string,
          greenPlatePermitDocId: null as unknown as string,
        }),
      );

      const res = await service.calculateEligibility(mockCaptainActor.id);

      expect(res.isDraftComplete).toBe(false);
      expect(res.isEligibleForAssignment).toBe(false);
      expect(res.ineligibilityReasons).toContain('Onboarding application draft is incomplete.');
    });

    it('should dynamically transition compliance status to EXPIRED when license expiry date is in the past', async () => {
      const expiredProfile = createMockDriverProfile({
        licenseExpiryDate: pastDate,
        verificationStatus: DriverComplianceStatus.VERIFIED,
      });
      driverProfileRepo.findOne.mockResolvedValue(expiredProfile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const res = await service.calculateEligibility(mockCaptainActor.id);

      expect(res.complianceStatus).toBe(DriverComplianceStatus.EXPIRED);
      expect(res.documentValidity.licenseValid).toBe(false);
      expect(res.isEligibleForAssignment).toBe(false);
      expect(res.ineligibilityReasons.some((r) => r.includes('license has expired'))).toBe(true);
    });

    it('should report captain as SUSPENDED when suspended by operations', async () => {
      const suspendedProfile = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.SUSPENDED,
        suspensionReason: 'Safety dispute during trip #8819',
      });
      driverProfileRepo.findOne.mockResolvedValue(suspendedProfile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const res = await service.calculateEligibility(mockCaptainActor.id);

      expect(res.complianceStatus).toBe(DriverComplianceStatus.SUSPENDED);
      expect(res.isEligibleForAssignment).toBe(false);
      expect(res.ineligibilityReasons.some((r) => r.includes('Safety dispute'))).toBe(true);
    });

    it('should reject assignment eligibility when assigned vehicle battery SoC is under 15%', async () => {
      const lowBatteryVehicle = createMockVehicle({ currentSocPercent: 12.0 });
      const profile = createMockDriverProfile({
        assignedVehicle: lowBatteryVehicle,
      });
      driverProfileRepo.findOne.mockResolvedValue(profile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const res = await service.calculateEligibility(mockCaptainActor.id);

      expect(res.documentValidity.batterySocAdequate).toBe(false);
      expect(res.isEligibleForAssignment).toBe(false);
      expect(res.ineligibilityReasons.some((r) => r.includes('below minimum safe threshold'))).toBe(
        true,
      );
    });

    it('should reject assignment eligibility when city has disabled EV service permissions', async () => {
      releaseBoundariesService.evaluate.mockReturnValue({
        allowed: false,
        city: 'tirupati',
        serviceCategory: 'private_ev',
        releasePhase: 'RELEASE_C_FUTURE',
        reason: 'Launch gates not yet satisfied for Tirupati.',
      });

      const profile = createMockDriverProfile({ city: 'tirupati' });
      driverProfileRepo.findOne.mockResolvedValue(profile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const res = await service.calculateEligibility(mockCaptainActor.id);

      expect(res.zonePermission.zoneAllowed).toBe(false);
      expect(res.isEligibleForAssignment).toBe(false);
      expect(res.ineligibilityReasons.some((r) => r.includes('disabled'))).toBe(true);
    });
  });

  describe('2. Duty Online / Offline State Machine & Enforcement', () => {
    it('should allow verified and eligible captain to go ONLINE', async () => {
      const profile = createMockDriverProfile({ dutyStatus: DutyStatus.OFFLINE });
      driverProfileRepo.findOne.mockResolvedValue(profile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const res = await service.toggleDuty(mockCaptainActor, {
        status: DutyStatus.ONLINE,
      });

      expect(res.dutyStatus).toBe(DutyStatus.ONLINE);
      expect(res.eligible).toBe(true);
      expect(profile.dutyStatus).toBe(DutyStatus.ONLINE);
      expect(driverProfileRepo.save).toHaveBeenCalledWith(profile);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_DUTY_ONLINE',
          status: 'SUCCESS',
        }),
      );
    });

    it('should allow captain to go OFFLINE at any time', async () => {
      const profile = createMockDriverProfile({ dutyStatus: DutyStatus.ONLINE });
      driverProfileRepo.findOne.mockResolvedValue(profile);

      const res = await service.toggleDuty(mockCaptainActor, {
        status: DutyStatus.OFFLINE,
      });

      expect(res.dutyStatus).toBe(DutyStatus.OFFLINE);
      expect(res.eligible).toBe(false);
      expect(profile.dutyStatus).toBe(DutyStatus.OFFLINE);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_DUTY_OFFLINE',
          status: 'SUCCESS',
        }),
      );
    });

    it('should strictly reject EXPIRED driver from going ONLINE with 422 Unprocessable Entity', async () => {
      const expiredProfile = createMockDriverProfile({
        licenseExpiryDate: pastDate,
        verificationStatus: DriverComplianceStatus.VERIFIED,
      });
      driverProfileRepo.findOne.mockResolvedValue(expiredProfile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      await expect(
        service.toggleDuty(mockCaptainActor, { status: DutyStatus.ONLINE }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_DUTY_TOGGLE_REJECTED',
          status: 'DENIED',
        }),
      );
    });

    it('should strictly reject SUSPENDED driver from going ONLINE with 422 Unprocessable Entity', async () => {
      const suspendedProfile = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.SUSPENDED,
        suspensionReason: 'Under review by safety officer',
      });
      driverProfileRepo.findOne.mockResolvedValue(suspendedProfile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      await expect(
        service.toggleDuty(mockCaptainActor, { status: DutyStatus.ONLINE }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_DUTY_TOGGLE_REJECTED',
          status: 'DENIED',
        }),
      );
    });

    it('should throw NotFoundException if driver profile does not exist when toggling duty', async () => {
      driverProfileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.toggleDuty(mockCaptainActor, { status: DutyStatus.ONLINE }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Administrative Compliance Status Management', () => {
    it('should allow operator to suspend a driver and force duty status to OFFLINE', async () => {
      const onlineProfile = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.VERIFIED,
        dutyStatus: DutyStatus.ONLINE,
      });
      driverProfileRepo.findOne.mockResolvedValue(onlineProfile);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const res = await service.updateComplianceStatus(mockOperatorActor, mockCaptainActor.id, {
        status: DriverComplianceStatus.SUSPENDED,
        suspensionReason: 'Document audit anomaly detected',
        notes: 'Immediate suspension pending re-upload',
      });

      expect(onlineProfile.verificationStatus).toBe(DriverComplianceStatus.SUSPENDED);
      expect(onlineProfile.suspensionReason).toBe('Document audit anomaly detected');
      // Safety auto-offline guard
      expect(onlineProfile.dutyStatus).toBe(DutyStatus.OFFLINE);
      expect(res.complianceStatus).toBe(DriverComplianceStatus.SUSPENDED);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_COMPLIANCE_STATUS_CHANGED',
        }),
      );
    });

    it('should throw BadRequestException if operator suspends without providing suspensionReason', async () => {
      const profile = createMockDriverProfile();
      driverProfileRepo.findOne.mockResolvedValue(profile);

      await expect(
        service.updateComplianceStatus(mockOperatorActor, mockCaptainActor.id, {
          status: DriverComplianceStatus.SUSPENDED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Scheduled Expiry Scans, Advance Warning Tiers & Local Boundary Handling (EV-029)', () => {
    it('should compute days remaining correctly at Andhra Pradesh local boundary', () => {
      const baseNow = new Date('2026-11-02T10:00:00.000Z');
      // Past expiry
      const expiredPast = new Date('2026-11-01T23:59:59.000Z');
      expect(calculateDaysRemainingToLocalBoundary(expiredPast, baseNow)).toBeLessThanOrEqual(0);

      // Future 1 day
      const future1d = new Date('2026-11-03T10:00:00.000Z');
      expect(calculateDaysRemainingToLocalBoundary(future1d, baseNow)).toBe(1);

      // Future 15 days
      const future15d = new Date(baseNow.getTime() + 15 * 24 * 60 * 60 * 1000);
      expect(calculateDaysRemainingToLocalBoundary(future15d, baseNow)).toBe(15);
    });

    it('should determine correct warning tiers based on days remaining', () => {
      expect(determineWarningTier(0)).toBe(ComplianceWarningTier.EXPIRED);
      expect(determineWarningTier(-2)).toBe(ComplianceWarningTier.EXPIRED);
      expect(determineWarningTier(1)).toBe(ComplianceWarningTier.WARNING_1D);
      expect(determineWarningTier(5)).toBe(ComplianceWarningTier.WARNING_7D);
      expect(determineWarningTier(14)).toBe(ComplianceWarningTier.WARNING_15D);
      expect(determineWarningTier(25)).toBe(ComplianceWarningTier.WARNING_30D);
      expect(determineWarningTier(45)).toBeNull();
    });

    it('should automatically transition VERIFIED captain to EXPIRED and force duty OFFLINE when license expires', async () => {
      const expiredLicenseDate = new Date('2026-11-01T18:29:59.000Z'); // Expired
      const onlineExpiredDriver = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.VERIFIED,
        dutyStatus: DutyStatus.ONLINE,
        licenseExpiryDate: expiredLicenseDate,
      });

      driverProfileRepo.find.mockResolvedValue([onlineExpiredDriver]);
      vehicleRepo.count.mockResolvedValue(1);

      const summary = await service.runScheduledExpiryScan(new Date('2026-11-02T00:00:00.000Z'));

      expect(summary.totalProfilesScanned).toBe(1);
      expect(summary.accountsSuspendedOrExpired).toBe(1);
      expect(onlineExpiredDriver.verificationStatus).toBe(DriverComplianceStatus.EXPIRED);
      expect(onlineExpiredDriver.dutyStatus).toBe(DutyStatus.OFFLINE);
      expect(driverProfileRepo.save).toHaveBeenCalledWith(onlineExpiredDriver);
      expect(complianceWarningRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          warningTier: ComplianceWarningTier.EXPIRED,
          targetType: 'DRIVER_LICENSE',
        }),
      );
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_AUTO_SUSPENDED_FOR_EXPIRY',
        }),
      );
    });

    it('should issue advance warning (WARNING_15D) for license expiring within 15 days without changing duty status', async () => {
      const expiringLicenseDate = new Date('2026-11-15T00:00:00.000Z');
      const onlineCaptain = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.VERIFIED,
        dutyStatus: DutyStatus.ONLINE,
        licenseExpiryDate: expiringLicenseDate,
      });

      driverProfileRepo.find.mockResolvedValue([onlineCaptain]);
      vehicleRepo.count.mockResolvedValue(1);

      const summary = await service.runScheduledExpiryScan(new Date('2026-11-02T00:00:00.000Z'));

      expect(summary.warningsIssued).toBe(1);
      expect(summary.accountsSuspendedOrExpired).toBe(0);
      expect(onlineCaptain.verificationStatus).toBe(DriverComplianceStatus.VERIFIED);
      expect(onlineCaptain.dutyStatus).toBe(DutyStatus.ONLINE);
      expect(complianceWarningRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          warningTier: ComplianceWarningTier.WARNING_15D,
          targetType: 'DRIVER_LICENSE',
        }),
      );
    });

    it('should safely force captain OFFLINE when assigned vehicle commercial insurance expires', async () => {
      const expiredInsuranceDate = new Date('2026-11-01T00:00:00.000Z');
      const vehicleWithExpiredInsurance = createMockVehicle({
        insuranceExpiryDate: expiredInsuranceDate,
      });
      const onlineDriver = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.VERIFIED,
        dutyStatus: DutyStatus.ONLINE,
        assignedVehicle: vehicleWithExpiredInsurance,
      });

      driverProfileRepo.find.mockResolvedValue([onlineDriver]);
      vehicleRepo.count.mockResolvedValue(1);

      const summary = await service.runScheduledExpiryScan(new Date('2026-11-02T00:00:00.000Z'));

      expect(summary.accountsSuspendedOrExpired).toBe(1);
      expect(onlineDriver.dutyStatus).toBe(DutyStatus.OFFLINE);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_AUTO_SUSPENDED_FOR_VEHICLE_EXPIRY',
        }),
      );
    });

    it('should avoid duplicate warnings if active warning for the same tier already exists', async () => {
      const expiringLicenseDate = new Date('2026-11-15T00:00:00.000Z');
      const driver = createMockDriverProfile({
        licenseExpiryDate: expiringLicenseDate,
      });

      driverProfileRepo.find.mockResolvedValue([driver]);
      // Existing active warning already recorded
      complianceWarningRepo.findOne.mockResolvedValue({ id: 'existing-w-1', isResolved: false });
      vehicleRepo.count.mockResolvedValue(1);

      const summary = await service.runScheduledExpiryScan(new Date('2026-11-02T00:00:00.000Z'));
      expect(summary.warningsIssued).toBe(0);
      expect(complianceWarningRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('5. Re-Verification Workflow & Historical Record Preservation (EV-029)', () => {
    it('should re-verify renewed driving license, transition EXPIRED to VERIFIED, resolve warnings, and restore eligibility', async () => {
      const expiredDriver = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.EXPIRED,
        suspensionReason: 'Driving license expired at local boundary',
        licenseExpiryDate: pastDate,
      });

      driverProfileRepo.findOne.mockResolvedValue(expiredDriver);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const mockDoc = new Document();
      mockDoc.id = 'doc-renewal-1';
      mockDoc.scanStatus = DocumentStatus.CLEAN;
      documentRepo.findOne.mockResolvedValue(mockDoc);

      const activeWarning = {
        id: 'w-active-1',
        userId: mockCaptainActor.id,
        targetType: 'DRIVER_LICENSE',
        isResolved: false,
        resolvedAt: null,
        resolutionType: null,
      };
      complianceWarningRepo.find.mockResolvedValue([activeWarning]);

      const renewalExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await service.reverifyCompliance(mockCaptainActor, {
        targetType: 'DRIVER_LICENSE',
        newExpiryDate: renewalExpiry,
        documentId: 'doc-renewal-1',
        newDocumentNumber: 'AP31 20269999000',
        notes: 'Commercial DL renewed at Visakhapatnam RTO',
      });

      expect(res.success).toBe(true);
      expect(expiredDriver.verificationStatus).toBe(DriverComplianceStatus.VERIFIED);
      expect(expiredDriver.suspensionReason).toBeNull();
      expect(expiredDriver.licenseNumber).toBe('AP31 20269999000');
      // Historical warning preserved but marked resolved
      expect(activeWarning.isResolved).toBe(true);
      expect(activeWarning.resolutionType).toBe('REVERIFIED');
      expect(complianceWarningRepo.save).toHaveBeenCalledWith(activeWarning);
      expect(res.eligibility.isEligibleForAssignment).toBe(true);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CAPTAIN_COMPLIANCE_REVERIFIED',
        }),
      );
    });

    it('should re-verify renewed vehicle insurance and restore roadworthiness', async () => {
      const expiredVehicle = createMockVehicle({
        insuranceExpiryDate: pastDate,
      });
      const driver = createMockDriverProfile({
        verificationStatus: DriverComplianceStatus.VERIFIED,
        assignedVehicle: expiredVehicle,
      });

      driverProfileRepo.findOne.mockResolvedValue(driver);
      captainAppRepo.findOne.mockResolvedValue(createMockCaptainApplication());

      const mockDoc = new Document();
      mockDoc.id = 'doc-ins-renewal-1';
      mockDoc.scanStatus = DocumentStatus.CLEAN;
      documentRepo.findOne.mockResolvedValue(mockDoc);
      complianceWarningRepo.find.mockResolvedValue([]);

      const renewalExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await service.reverifyCompliance(mockCaptainActor, {
        targetType: 'VEHICLE_INSURANCE',
        newExpiryDate: renewalExpiry,
        documentId: 'doc-ins-renewal-1',
        newDocumentNumber: 'POL-NEW-2026-99',
      });

      expect(res.success).toBe(true);
      expect(expiredVehicle.insurancePolicyNumber).toBe('POL-NEW-2026-99');
      expect(vehicleRepo.save).toHaveBeenCalledWith(expiredVehicle);
      expect(res.eligibility.documentValidity.vehicleInsuranceValid).toBe(true);
    });

    it('should reject re-verification if new statutory expiry date is in the past', async () => {
      await expect(
        service.reverifyCompliance(mockCaptainActor, {
          targetType: 'DRIVER_LICENSE',
          newExpiryDate: pastDate.toISOString(),
          documentId: 'doc-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject re-verification if renewal document is not found', async () => {
      documentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.reverifyCompliance(mockCaptainActor, {
          targetType: 'DRIVER_LICENSE',
          newExpiryDate: futureDate.toISOString(),
          documentId: 'doc-missing-99',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject re-verification if renewal document failed malware scanning', async () => {
      const infectedDoc = new Document();
      infectedDoc.id = 'doc-infected-1';
      infectedDoc.scanStatus = DocumentStatus.INFECTED;
      documentRepo.findOne.mockResolvedValue(infectedDoc);

      await expect(
        service.reverifyCompliance(mockCaptainActor, {
          targetType: 'DRIVER_LICENSE',
          newExpiryDate: futureDate.toISOString(),
          documentId: 'doc-infected-1',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should retrieve active and historical compliance warnings with proper ordering', async () => {
      const mockWarnings = [
        {
          id: 'w-1',
          userId: mockCaptainActor.id,
          targetType: 'DRIVER_LICENSE',
          targetIdentifier: 'AP31 20240001122',
          expiryDate: futureDate,
          daysRemaining: 14,
          warningTier: ComplianceWarningTier.WARNING_15D,
          isResolved: false,
          resolvedAt: null,
          resolutionType: null,
          actionRequired: 'Renew license',
          createdAt: new Date(),
          user: { name: 'Venkata Ramana' },
        },
      ];

      complianceWarningRepo.find.mockResolvedValue(mockWarnings);

      const warnings = await service.getComplianceWarnings(mockCaptainActor, {
        isResolved: false,
      });

      expect(warnings).toHaveLength(1);
      expect(warnings[0].warningTier).toBe(ComplianceWarningTier.WARNING_15D);
      expect(warnings[0].captainName).toBe('Venkata Ramana');
    });
  });
});
