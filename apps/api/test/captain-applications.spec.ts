import { CaptainApplicationsService } from '../src/modules/captain-applications/captain-applications.service';
import { CaptainApplication } from '../src/database/entities/captain-application.entity';
import { CaptainApplicationReview } from '../src/database/entities/captain-application-review.entity';
import { User } from '../src/database/entities/user.entity';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';
import { Document } from '../src/database/entities/document.entity';
import { AuditEvent } from '../src/database/entities/audit-event.entity';
import { Repository } from 'typeorm';
import {
  CaptainApplicationStatus,
  RequirementStatus,
  VehicleOwnershipType,
  VehicleCategory,
  PropulsionType,
  PlatformRole,
} from '@ecoride/contracts';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('Captain Application & Document Verification (EV-024 Unit Tests)', () => {
  let service: CaptainApplicationsService;

  let mockAppRepo: Partial<Repository<CaptainApplication>>;
  let mockReviewRepo: Partial<Repository<CaptainApplicationReview>>;
  let mockUserRepo: Partial<Repository<User>>;
  let mockDriverProfileRepo: Partial<Repository<DriverProfile>>;
  let mockVehicleRepo: Partial<Repository<Vehicle>>;
  let mockDocRepo: Partial<Repository<Document>>;
  let mockAuditRepo: Partial<Repository<AuditEvent>>;

  const captainA: CurrentActorPayload = {
    id: 'c1000000-0000-0000-0000-000000000001',
    role: PlatformRole.RIDER,
    scopes: ['driver:self', 'document:upload:self'],
  };

  const captainB: CurrentActorPayload = {
    id: 'c2000000-0000-0000-0000-000000000002',
    role: PlatformRole.RIDER,
    scopes: ['driver:self'],
  };

  const operatorActor: CurrentActorPayload = {
    id: 'o3000000-0000-0000-0000-000000000003',
    role: PlatformRole.OPERATOR,
    scopes: ['captain:review', 'fleet:manage'],
  };

  let appsStore: Map<string, CaptainApplication>;
  let reviewsStore: CaptainApplicationReview[];
  let usersStore: Map<string, User>;
  let documentsStore: Map<string, Document>;
  let driverProfilesStore: Map<string, DriverProfile>;
  let vehiclesStore: Map<string, Vehicle>;
  let auditStore: AuditEvent[];

  beforeEach(() => {
    appsStore = new Map();
    reviewsStore = [];
    usersStore = new Map();
    documentsStore = new Map();
    driverProfilesStore = new Map();
    vehiclesStore = new Map();
    auditStore = [];

    // Seed mock user
    const userA = new User();
    userA.id = captainA.id;
    userA.role = PlatformRole.RIDER;
    userA.name = 'Ravi Captain Applicant';
    usersStore.set(userA.id, userA);

    // Seed mock KYC documents belonging to captainA
    const licenseDoc = new Document();
    licenseDoc.id = 'doc-license-1111';
    licenseDoc.userId = captainA.id;
    documentsStore.set(licenseDoc.id, licenseDoc);

    const aadhaarDoc = new Document();
    aadhaarDoc.id = 'doc-aadhaar-2222';
    aadhaarDoc.userId = captainA.id;
    documentsStore.set(aadhaarDoc.id, aadhaarDoc);

    const rcDoc = new Document();
    rcDoc.id = 'doc-rc-3333';
    rcDoc.userId = captainA.id;
    documentsStore.set(rcDoc.id, rcDoc);

    const permitDoc = new Document();
    permitDoc.id = 'doc-permit-4444';
    permitDoc.userId = captainA.id;
    documentsStore.set(permitDoc.id, permitDoc);

    const otherUserDoc = new Document();
    otherUserDoc.id = 'doc-other-9999';
    otherUserDoc.userId = captainB.id;
    documentsStore.set(otherUserDoc.id, otherUserDoc);

    mockAppRepo = {
      create: jest.fn().mockImplementation((dto) => {
        const app = new CaptainApplication();
        app.id = 'app-' + Math.random().toString(36).substring(2, 9);
        app.createdAt = new Date();
        app.updatedAt = new Date();
        app.reviews = [];
        Object.assign(app, dto);
        return app;
      }),
      save: jest.fn().mockImplementation(async (entity: CaptainApplication) => {
        appsStore.set(entity.id, entity);
        return entity;
      }),
      findOne: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        for (const app of appsStore.values()) {
          if (opts.where.id && app.id === opts.where.id) {
            app.reviews = reviewsStore.filter((r) => r.applicationId === app.id);
            return app;
          }
          if (opts.where.userId && app.userId === opts.where.userId) {
            app.reviews = reviewsStore.filter((r) => r.applicationId === app.id);
            return app;
          }
        }
        return null;
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockImplementation(async () => {
          const all = Array.from(appsStore.values());
          return [all, all.length];
        }),
      }),
    };

    mockReviewRepo = {
      create: jest.fn().mockImplementation((dto) => {
        const review = new CaptainApplicationReview();
        review.id = 'rev-' + Math.random().toString(36).substring(2, 9);
        review.reviewedAt = new Date();
        Object.assign(review, dto);
        return review;
      }),
      save: jest.fn().mockImplementation(async (entity: CaptainApplicationReview) => {
        reviewsStore.push(entity);
        return entity;
      }),
      find: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        return reviewsStore.filter((r) => r.applicationId === opts.where.applicationId);
      }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        return usersStore.get(opts.where.id as string) || null;
      }),
      save: jest.fn().mockImplementation(async (entity: User) => {
        usersStore.set(entity.id, entity);
        return entity;
      }),
    };

    mockDriverProfileRepo = {
      findOne: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        return driverProfilesStore.get(opts.where.userId as string) || null;
      }),
      create: jest.fn().mockImplementation((dto) => {
        const dp = new DriverProfile();
        dp.id = 'dp-' + Math.random().toString(36).substring(2, 9);
        Object.assign(dp, dto);
        return dp;
      }),
      save: jest.fn().mockImplementation(async (entity: DriverProfile) => {
        driverProfilesStore.set(entity.userId, entity);
        return entity;
      }),
    };

    mockVehicleRepo = {
      findOne: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        for (const v of vehiclesStore.values()) {
          if (
            opts.where.registrationNumber &&
            v.registrationNumber === opts.where.registrationNumber
          )
            return v;
          if (opts.where.id && v.id === opts.where.id) return v;
        }
        return null;
      }),
      create: jest.fn().mockImplementation((dto) => {
        const v = new Vehicle();
        v.id = 'veh-' + Math.random().toString(36).substring(2, 9);
        Object.assign(v, dto);
        return v;
      }),
      save: jest.fn().mockImplementation(async (entity: Vehicle) => {
        vehiclesStore.set(entity.id, entity);
        return entity;
      }),
    };

    mockDocRepo = {
      findOne: jest.fn().mockImplementation(async (opts: { where: Record<string, unknown> }) => {
        return documentsStore.get(opts.where.id as string) || null;
      }),
    };

    mockAuditRepo = {
      create: jest.fn().mockImplementation((dto) => {
        const ev = new AuditEvent();
        Object.assign(ev, dto);
        return ev;
      }),
      save: jest.fn().mockImplementation(async (ev) => {
        auditStore.push(ev);
        return ev;
      }),
    };

    service = new CaptainApplicationsService(
      mockAppRepo as Repository<CaptainApplication>,
      mockReviewRepo as Repository<CaptainApplicationReview>,
      mockUserRepo as Repository<User>,
      mockDriverProfileRepo as Repository<DriverProfile>,
      mockVehicleRepo as Repository<Vehicle>,
      mockDocRepo as Repository<Document>,
      mockAuditRepo as Repository<AuditEvent>,
    );
  });

  describe('1. Application Draft Creation and Persistence', () => {
    it('should create an initial draft for a new applicant with persisted defaults', async () => {
      const app = await service.getOrCreateDraft(captainA);

      expect(app.id).toBeDefined();
      expect(app.userId).toBe(captainA.id);
      expect(app.status).toBe(CaptainApplicationStatus.DRAFT);
      expect(app.submissionCount).toBe(0);
      expect(app.city).toBe('visakhapatnam');
    });

    it('should update draft fields incrementally and persist state', async () => {
      await service.getOrCreateDraft(captainA);

      const updated = await service.updateDraft(captainA, {
        fullName: 'Ravi Teja',
        drivingLicenseNumber: 'AP31 20200001234',
        vehicleOwnershipType: VehicleOwnershipType.OWNED,
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        vehicleMake: 'Ather Energy',
        vehicleModel: '450X',
        city: 'visakhapatnam',
      });

      expect(updated.fullName).toBe('Ravi Teja');
      expect(updated.drivingLicenseNumber).toBe('AP31 20200001234');
      expect(updated.vehicleMake).toBe('Ather Energy');
      expect(updated.status).toBe(CaptainApplicationStatus.DRAFT);
    });

    it('should prevent linking a document belonging to another user', async () => {
      await service.getOrCreateDraft(captainA);

      await expect(
        service.updateDraft(captainA, {
          drivingLicenseDocId: 'doc-other-9999', // belongs to captainB
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Electric-Only Propulsion Enforcement in Applications', () => {
    it('should permit BATTERY_ELECTRIC propulsion in application', async () => {
      await service.getOrCreateDraft(captainA);

      const updated = await service.updateDraft(captainA, {
        propulsionType: PropulsionType.BATTERY_ELECTRIC,
      });
      expect(updated.propulsionType).toBe('BATTERY_ELECTRIC');
    });

    it('should strictly reject PETROL, DIESEL, or CNG vehicle specifications with 400 Bad Request', async () => {
      await service.getOrCreateDraft(captainA);

      await expect(
        service.updateDraft(captainA, {
          propulsionType: 'PETROL',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateDraft(captainA, {
          propulsionType: 'DIESEL',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateDraft(captainA, {
          propulsionType: 'CNG',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Field Validation on Submission', () => {
    it('should reject submission if mandatory driver fields or documents are missing', async () => {
      await service.getOrCreateDraft(captainA);
      // Draft has no full name, no license, etc.

      await expect(service.submitApplication(captainA)).rejects.toThrow(BadRequestException);
    });

    it('should successfully submit application when all mandatory driver and vehicle requirements are met', async () => {
      await service.getOrCreateDraft(captainA);

      await service.updateDraft(captainA, {
        fullName: 'Ravi Teja',
        drivingLicenseNumber: 'AP31 20200001234',
        drivingLicenseDocId: 'doc-license-1111',
        aadhaarDocId: 'doc-aadhaar-2222',
        emergencyContactName: 'Anand Kumar',
        emergencyContactPhone: '+919876543210',
        vehicleOwnershipType: VehicleOwnershipType.OWNED,
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        vehicleRegistrationNumber: 'AP31EV0001',
        vehicleMake: 'Ather',
        vehicleModel: '450X',
        vehicleRcDocId: 'doc-rc-3333',
        greenPlatePermitDocId: 'doc-permit-4444',
      });

      const submitted = await service.submitApplication(captainA, {
        notes: 'Ready for EV driver onboarding',
      });

      expect(submitted.status).toBe(CaptainApplicationStatus.SUBMITTED);
      expect(submitted.submissionCount).toBe(1);
      expect(submitted.submittedAt).toBeDefined();
      expect(submitted.reviewHistory).toHaveLength(1);
      expect(submitted.reviewHistory![0].newStatus).toBe(CaptainApplicationStatus.SUBMITTED);
    });

    it('should prevent modifying draft while application is under review', async () => {
      await service.getOrCreateDraft(captainA);
      await service.updateDraft(captainA, {
        fullName: 'Ravi Teja',
        drivingLicenseNumber: 'AP31 20200001234',
        drivingLicenseDocId: 'doc-license-1111',
        aadhaarDocId: 'doc-aadhaar-2222',
        emergencyContactName: 'Anand Kumar',
        emergencyContactPhone: '+919876543210',
        vehicleOwnershipType: VehicleOwnershipType.FLEET_ASSIGNED,
        vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
      });
      await service.submitApplication(captainA);

      await expect(
        service.updateDraft(captainA, {
          fullName: 'Tampered Name',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Independent Verification of Driver and Vehicle Requirements', () => {
    let submittedAppId: string;

    beforeEach(async () => {
      await service.getOrCreateDraft(captainA);
      await service.updateDraft(captainA, {
        fullName: 'Ravi Teja',
        drivingLicenseNumber: 'AP31 20200001234',
        drivingLicenseDocId: 'doc-license-1111',
        aadhaarDocId: 'doc-aadhaar-2222',
        emergencyContactName: 'Anand Kumar',
        emergencyContactPhone: '+919876543210',
        vehicleOwnershipType: VehicleOwnershipType.OWNED,
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        vehicleRegistrationNumber: 'AP31EV0001',
        vehicleMake: 'Ather',
        vehicleModel: '450X',
        vehicleRcDocId: 'doc-rc-3333',
        greenPlatePermitDocId: 'doc-permit-4444',
      });
      const submitted = await service.submitApplication(captainA);
      submittedAppId = submitted.id;
    });

    it('should allow operator to approve driver requirements while rejecting vehicle requirements', async () => {
      const reviewed = await service.reviewApplication(operatorActor, submittedAppId, {
        overallStatus: CaptainApplicationStatus.REJECTED,
        driverRequirementsStatus: RequirementStatus.APPROVED,
        vehicleRequirementsStatus: RequirementStatus.REJECTED,
        vehicleRejectionReason: 'Vehicle insurance certificate missing or expired',
        notes: 'Driver approved; please upload valid commercial insurance for AP31EV0001',
      });

      expect(reviewed.status).toBe(CaptainApplicationStatus.REJECTED);
      expect(reviewed.driverRequirementsStatus).toBe(RequirementStatus.APPROVED);
      expect(reviewed.vehicleRequirementsStatus).toBe(RequirementStatus.REJECTED);
      expect(reviewed.vehicleRejectionReason).toBe(
        'Vehicle insurance certificate missing or expired',
      );
      expect(reviewed.overallRejectionReason).toContain(
        'Driver approved; please upload valid commercial insurance',
      );
    });

    it('should reject overall approval if driver or vehicle requirements are not approved', async () => {
      await expect(
        service.reviewApplication(operatorActor, submittedAppId, {
          overallStatus: CaptainApplicationStatus.APPROVED,
          driverRequirementsStatus: RequirementStatus.APPROVED,
          vehicleRequirementsStatus: RequirementStatus.REJECTED, // Inconsistent!
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fully activate captain profile and link EV vehicle when both requirements are approved', async () => {
      const reviewed = await service.reviewApplication(operatorActor, submittedAppId, {
        overallStatus: CaptainApplicationStatus.APPROVED,
        driverRequirementsStatus: RequirementStatus.APPROVED,
        vehicleRequirementsStatus: RequirementStatus.APPROVED,
        notes: 'Fully approved for Visakhapatnam EV taxi fleet',
      });

      expect(reviewed.status).toBe(CaptainApplicationStatus.APPROVED);

      // Verify user promoted to CAPTAIN
      const user = usersStore.get(captainA.id);
      expect(user?.role).toBe(PlatformRole.CAPTAIN);

      // Verify DriverProfile verified
      const dp = driverProfilesStore.get(captainA.id);
      expect(dp?.verificationStatus).toBe('VERIFIED');
      expect(dp?.assignedVehicleId).toBeDefined();

      // Verify Vehicle registered and linked
      expect(reviewed.createdVehicleId).toBeDefined();
      const vehicle = vehiclesStore.get(reviewed.createdVehicleId!);
      expect(vehicle?.greenPlateVerified).toBe(true);
      expect(vehicle?.propulsionType).toBe('BATTERY_ELECTRIC');
    });
  });

  describe('5. Resubmission After Rejection Without Creating Duplicates', () => {
    let targetAppId: string;

    beforeEach(async () => {
      await service.getOrCreateDraft(captainA);
      await service.updateDraft(captainA, {
        fullName: 'Ravi Teja',
        drivingLicenseNumber: 'AP31 20200001234',
        drivingLicenseDocId: 'doc-license-1111',
        aadhaarDocId: 'doc-aadhaar-2222',
        emergencyContactName: 'Anand Kumar',
        emergencyContactPhone: '+919876543210',
        vehicleOwnershipType: VehicleOwnershipType.OWNED,
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        vehicleRegistrationNumber: 'AP31EV0001',
        vehicleMake: 'Ather',
        vehicleModel: '450X',
        vehicleRcDocId: 'doc-rc-3333',
        greenPlatePermitDocId: 'doc-permit-4444',
      });
      const submitted = await service.submitApplication(captainA);
      targetAppId = submitted.id;

      // Operator rejects vehicle requirements
      await service.reviewApplication(operatorActor, targetAppId, {
        overallStatus: CaptainApplicationStatus.REJECTED,
        driverRequirementsStatus: RequirementStatus.APPROVED,
        vehicleRequirementsStatus: RequirementStatus.REJECTED,
        vehicleRejectionReason: 'Invalid RC document',
      });
    });

    it('should permit editing a rejected application on the exact same record', async () => {
      // Captain updates the rejected application with corrected vehicle model & details
      const updatedDraft = await service.updateDraft(captainA, {
        vehicleModel: '450X Gen 3 (Updated)',
      });

      // Assert record ID is unchanged (no duplicate record)
      expect(updatedDraft.id).toBe(targetAppId);
      expect(updatedDraft.vehicleModel).toBe('450X Gen 3 (Updated)');
      expect(appsStore.size).toBe(1);
    });

    it('should increment submissionCount and append to review history on resubmission', async () => {
      // Resubmit
      const resubmitted = await service.submitApplication(captainA, {
        notes: 'Uploaded corrected vehicle details',
      });

      // Still the same application record
      expect(resubmitted.id).toBe(targetAppId);
      expect(resubmitted.status).toBe(CaptainApplicationStatus.SUBMITTED);
      expect(resubmitted.submissionCount).toBe(2); // Incremented!
      expect(appsStore.size).toBe(1); // Exact same record

      // Check review history has 3 entries:
      // 1. Initial submit
      // 2. Operator rejection
      // 3. Resubmit
      const history = await service.getApplicationReviewHistory(captainA);
      expect(history.length).toBeGreaterThanOrEqual(3);
      expect(history[0].newStatus).toBe(CaptainApplicationStatus.SUBMITTED);
    });
  });

  describe('6. Security and Cross-Account Isolation', () => {
    it('should throw NotFoundException when querying a nonexistent application ID', async () => {
      await expect(
        service.getApplicationById(operatorActor, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent Captain B from accessing Captain A’s application', async () => {
      const appA = await service.getOrCreateDraft(captainA);

      await expect(service.getApplicationById(captainB, appA.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should prevent regular captains from calling admin review endpoint', async () => {
      const appA = await service.getOrCreateDraft(captainA);

      await expect(
        service.reviewApplication(captainB, appA.id, {
          overallStatus: CaptainApplicationStatus.APPROVED,
          driverRequirementsStatus: RequirementStatus.APPROVED,
          vehicleRequirementsStatus: RequirementStatus.APPROVED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
