import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { ExpandVehiclesTableWithEVCompliance1700000000008 } from '../src/database/migrations/1700000000008-ExpandVehiclesTableWithEVCompliance';
import { CreateCaptainApplicationsAndReviewHistory1700000000009 } from '../src/database/migrations/1700000000009-CreateCaptainApplicationsAndReviewHistory';
import { AddDriverComplianceAndDutyStatus1700000000010 } from '../src/database/migrations/1700000000010-AddDriverComplianceAndDutyStatus';
import {
  PlatformRole,
  DriverComplianceStatus,
  DutyStatus,
  VehicleCategory,
  VehicleVerificationStatus,
  PropulsionType,
  CaptainApplicationStatus,
} from '@ecoride/contracts';

describe('Captain Compliance Eligibility State Machine E2E Integration (EV-025)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let dataSource: DataSource;

  const captainVerified = {
    id: 'c1000000-0000-4000-8000-000000000001',
    phone: '+919876250001',
    role: PlatformRole.CAPTAIN,
    name: 'Suresh Varma (Verified EV Captain)',
  };

  const captainSuspended = {
    id: 'c2000000-0000-4000-8000-000000000002',
    phone: '+919876250002',
    role: PlatformRole.CAPTAIN,
    name: 'Ravi Teja (Suspended Captain)',
  };

  const captainExpired = {
    id: 'c3000000-0000-4000-8000-000000000003',
    phone: '+919876250003',
    role: PlatformRole.CAPTAIN,
    name: 'Mohan Krishna (Expired License Captain)',
  };

  const operatorUser = {
    id: 'a1000000-0000-4000-8000-000000000001',
    phone: '+919876250009',
    role: PlatformRole.OPERATOR,
    name: 'Lavanya Safety & Compliance Officer',
  };

  const vehicleId1 = 'e1000000-0000-4000-8000-000000000001';
  const vehicleId2 = 'e2000000-0000-4000-8000-000000000002';
  const vehicleId3 = 'e3000000-0000-4000-8000-000000000003';

  const docId1 = 'd1000000-0000-4000-8000-000000000001';
  const docId2 = 'd2000000-0000-4000-8000-000000000002';
  const docId3 = 'd3000000-0000-4000-8000-000000000003';
  const docId4 = 'd4000000-0000-4000-8000-000000000004';

  const futureYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const pastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health', 'health/(.*)', 'metrics'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    dataSource = app.get(DataSource);

    if (dataSource.isInitialized) {
      // Ensure migrations 8, 9, 10 are applied on live DB
      try {
        await new ExpandVehiclesTableWithEVCompliance1700000000008().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema columns already present
      }
      try {
        await new CreateCaptainApplicationsAndReviewHistory1700000000009().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema table already present
      }
      try {
        await new AddDriverComplianceAndDutyStatus1700000000010().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema columns already present
      }

      // 1. Cleanup previous test artifacts
      await dataSource.query(`
        DELETE FROM "captain_application_reviews" WHERE "reviewer_id" = '${operatorUser.id}' OR "application_id" IN (
          SELECT "id" FROM "captain_applications" WHERE "user_id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}')
        );
        DELETE FROM "captain_applications" WHERE "user_id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}');
        DELETE FROM "driver_profiles" WHERE "user_id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}')
          OR "license_number" IN ('AP31 20250001111', 'AP31 20250002222', 'AP31 20250003333');
        DELETE FROM "vehicles" WHERE "id" IN ('${vehicleId1}', '${vehicleId2}', '${vehicleId3}')
          OR "registration_number" IN ('AP31EV2501', 'AP31EV2502', 'AP31EV2503');
        DELETE FROM "documents" WHERE "id" IN ('${docId1}', '${docId2}', '${docId3}', '${docId4}');
        DELETE FROM "users" WHERE "id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}', '${operatorUser.id}')
          OR "phone" IN ('${captainVerified.phone}', '${captainSuspended.phone}', '${captainExpired.phone}', '${operatorUser.phone}');
      `);

      // 2. Seed test users
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES
          ('${captainVerified.id}', '${captainVerified.phone}', '${captainVerified.role}', '${captainVerified.name}', true),
          ('${captainSuspended.id}', '${captainSuspended.phone}', '${captainSuspended.role}', '${captainSuspended.name}', true),
          ('${captainExpired.id}', '${captainExpired.phone}', '${captainExpired.role}', '${captainExpired.name}', true),
          ('${operatorUser.id}', '${operatorUser.phone}', '${operatorUser.role}', '${operatorUser.name}', true);
      `);

      // 3. Seed verified KYC documents
      await dataSource.query(`
        INSERT INTO "documents" ("id", "user_id", "document_type", "original_filename", "storage_key", "mime_type", "file_size_bytes", "sha256_checksum", "scan_status")
        VALUES
          ('${docId1}', '${captainVerified.id}', 'DRIVING_LICENSE', 'lic.jpg', 'kyc/lic.jpg', 'image/jpeg', 102400, 'sha256_lic', 'CLEAN'),
          ('${docId2}', '${captainVerified.id}', 'AADHAAR', 'aadh.pdf', 'kyc/aadh.pdf', 'application/pdf', 102400, 'sha256_aadh', 'CLEAN'),
          ('${docId3}', '${captainVerified.id}', 'VEHICLE_RC', 'rc.jpg', 'kyc/rc.jpg', 'image/jpeg', 102400, 'sha256_rc', 'CLEAN'),
          ('${docId4}', '${captainVerified.id}', 'GREEN_PLATE_PERMIT', 'perm.pdf', 'kyc/perm.pdf', 'application/pdf', 102400, 'sha256_perm', 'CLEAN');
      `);

      // 4. Seed verified 100% BEV electric vehicles
      await dataSource.query(`
        INSERT INTO "vehicles" (
          "id", "registration_number", "propulsion_type", "vehicle_category", "make", "model",
          "battery_capacity_kwh", "current_soc_percent", "rated_range_km", "green_plate_verified",
          "verification_status", "city", "is_active", "insurance_expiry_date", "fitness_expiry_date", "commercial_permit_expiry"
        ) VALUES
          ('${vehicleId1}', 'AP31EV2501', '${PropulsionType.BATTERY_ELECTRIC}', '${VehicleCategory.CITY_COMMUTE_2W}', 'Ather Energy', '450X', 3.7, 95.0, 110, true, '${VehicleVerificationStatus.VERIFIED}', 'visakhapatnam', true, '${futureYear}', '${futureYear}', '${futureYear}'),
          ('${vehicleId2}', 'AP31EV2502', '${PropulsionType.BATTERY_ELECTRIC}', '${VehicleCategory.CITY_COMMUTE_2W}', 'Ola Electric', 'S1 Pro', 4.0, 80.0, 130, true, '${VehicleVerificationStatus.VERIFIED}', 'visakhapatnam', true, '${futureYear}', '${futureYear}', '${futureYear}'),
          ('${vehicleId3}', 'AP31EV2503', '${PropulsionType.BATTERY_ELECTRIC}', '${VehicleCategory.CITY_COMMUTE_2W}', 'TVS', 'iQube', 3.4, 85.0, 100, true, '${VehicleVerificationStatus.VERIFIED}', 'visakhapatnam', true, '${futureYear}', '${futureYear}', '${futureYear}');
      `);

      // 4. Seed driver profiles with different compliance states:
      // Captain 1: VERIFIED, unexpired license, roadworthy vehicle
      // Captain 2: SUSPENDED with suspension reason
      // Captain 3: EXPIRED license in past
      await dataSource.query(`
        INSERT INTO "driver_profiles" (
          "user_id", "license_number", "badge_number", "verification_status", "duty_status",
          "license_expiry_date", "green_plate_permit_verified", "safety_training_completed",
          "city", "assigned_vehicle_id"
        ) VALUES
          ('${captainVerified.id}', 'AP31 20250001111', 'BDG-AP-01', '${DriverComplianceStatus.VERIFIED}', '${DutyStatus.OFFLINE}', '${futureYear}', true, true, 'visakhapatnam', '${vehicleId1}'),
          ('${captainSuspended.id}', 'AP31 20250002222', 'BDG-AP-02', '${DriverComplianceStatus.SUSPENDED}', '${DutyStatus.OFFLINE}', '${futureYear}', true, true, 'visakhapatnam', '${vehicleId2}'),
          ('${captainExpired.id}', 'AP31 20250003333', 'BDG-AP-03', '${DriverComplianceStatus.VERIFIED}', '${DutyStatus.OFFLINE}', '${pastMonth}', true, true, 'visakhapatnam', '${vehicleId3}');
      `);

      // 5. Seed completed application for Captain 1
      await dataSource.query(`
        INSERT INTO "captain_applications" (
          "user_id", "status", "submission_count", "full_name", "driving_license_number",
          "driving_license_doc_id", "aadhaar_doc_id", "vehicle_registration_number",
          "vehicle_rc_doc_id", "green_plate_permit_doc_id", "propulsion_type", "city",
          "driver_requirements_status", "vehicle_requirements_status"
        ) VALUES (
          '${captainVerified.id}', '${CaptainApplicationStatus.APPROVED}', 1, '${captainVerified.name}',
          'AP31 20250001111', '${docId1}', '${docId2}',
          'AP31EV2501', '${docId3}', '${docId4}',
          '${PropulsionType.BATTERY_ELECTRIC}', 'visakhapatnam', 'APPROVED', 'APPROVED'
        );
      `);
    }
  }, 30000);

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query(`
        DELETE FROM "captain_application_reviews" WHERE "reviewer_id" = '${operatorUser.id}' OR "application_id" IN (
          SELECT "id" FROM "captain_applications" WHERE "user_id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}')
        );
        DELETE FROM "captain_applications" WHERE "user_id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}');
        DELETE FROM "driver_profiles" WHERE "user_id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}')
          OR "license_number" IN ('AP31 20250001111', 'AP31 20250002222', 'AP31 20250003333');
        DELETE FROM "vehicles" WHERE "id" IN ('${vehicleId1}', '${vehicleId2}', '${vehicleId3}')
          OR "registration_number" IN ('AP31EV2501', 'AP31EV2502', 'AP31EV2503');
        DELETE FROM "documents" WHERE "id" IN ('${docId1}', '${docId2}', '${docId3}', '${docId4}');
        DELETE FROM "users" WHERE "id" IN ('${captainVerified.id}', '${captainSuspended.id}', '${captainExpired.id}', '${operatorUser.id}');
      `);
    }
    if (app) {
      await app.close();
    }
  }, 30000);

  describe('1. Acceptance: Verified and Complete Captain Is Not Mislabeled Draft', () => {
    it('should report verified captain with complianceStatus: VERIFIED and NOT DRAFT', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/compliance')
        .set('x-actor-user-id', captainVerified.id)
        .set('x-actor-role', captainVerified.role)
        .expect(200);

      // Explicit verification: Not mislabeled draft
      expect(res.body.complianceStatus).toBe(DriverComplianceStatus.VERIFIED);
      expect(res.body.complianceStatus).not.toBe('DRAFT');
      expect(res.body.isDraftComplete).toBe(true);
      expect(res.body.isEligibleForAssignment).toBe(true);
      expect(res.body.dutyStatus).toBe(DutyStatus.OFFLINE);
      expect(res.body.ineligibilityReasons).toHaveLength(0);
      expect(res.body.approvalDetails.driverApproved).toBe(true);
      expect(res.body.approvalDetails.vehicleApproved).toBe(true);
      expect(res.body.documentValidity.licenseValid).toBe(true);
      expect(res.body.documentValidity.vehicleRoadworthy).toBe(true);
      expect(res.body.zonePermission.zoneAllowed).toBe(true);
    });
  });

  describe('2. Acceptance: Expired Driver Cannot Go Online', () => {
    it('should detect expired license and report complianceStatus: EXPIRED', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/compliance')
        .set('x-actor-user-id', captainExpired.id)
        .set('x-actor-role', captainExpired.role)
        .expect(200);

      expect(res.body.complianceStatus).toBe(DriverComplianceStatus.EXPIRED);
      expect(res.body.documentValidity.licenseValid).toBe(false);
      expect(res.body.isEligibleForAssignment).toBe(false);
      expect(res.body.ineligibilityReasons.some((r: string) => r.includes('expired'))).toBe(true);
    });

    it('should strictly reject EXPIRED driver from toggling duty to ONLINE with 422 Unprocessable Entity', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/duty')
        .set('x-actor-user-id', captainExpired.id)
        .set('x-actor-role', captainExpired.role)
        .send({ status: DutyStatus.ONLINE })
        .expect(422);

      expect(res.body.error.message).toContain('Cannot go online');
      expect(res.body.error.message).toContain(DriverComplianceStatus.EXPIRED);
      expect(res.body.error.details.some((r: string) => r.includes('expired'))).toBe(true);
    });
  });

  describe('3. Acceptance: Suspended Driver Cannot Go Online', () => {
    it('should report complianceStatus: SUSPENDED with operational reason', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/compliance')
        .set('x-actor-user-id', captainSuspended.id)
        .set('x-actor-role', captainSuspended.role)
        .expect(200);

      expect(res.body.complianceStatus).toBe(DriverComplianceStatus.SUSPENDED);
      expect(res.body.isEligibleForAssignment).toBe(false);
      expect(res.body.ineligibilityReasons.some((r: string) => r.includes('suspended'))).toBe(true);
    });

    it('should strictly reject SUSPENDED driver from toggling duty to ONLINE with 422 Unprocessable Entity', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/duty')
        .set('x-actor-user-id', captainSuspended.id)
        .set('x-actor-role', captainSuspended.role)
        .send({ status: DutyStatus.ONLINE })
        .expect(422);

      expect(res.body.error.message).toContain('Cannot go online');
      expect(res.body.error.message).toContain(DriverComplianceStatus.SUSPENDED);
    });
  });

  describe('4. Verified Eligible Captain Duty Online / Offline Workflow', () => {
    it('should allow verified captain to toggle duty to ONLINE with 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/duty')
        .set('x-actor-user-id', captainVerified.id)
        .set('x-actor-role', captainVerified.role)
        .send({ status: DutyStatus.ONLINE })
        .expect(200);

      expect(res.body.dutyStatus).toBe(DutyStatus.ONLINE);
      expect(res.body.eligible).toBe(true);
      expect(res.body.message).toContain('ONLINE');

      // Verify in DB
      const dbCheck = await dataSource.query(`
        SELECT "duty_status", "duty_last_toggled_at" FROM "driver_profiles" WHERE "user_id" = '${captainVerified.id}';
      `);
      expect(dbCheck[0].duty_status).toBe(DutyStatus.ONLINE);
      expect(dbCheck[0].duty_last_toggled_at).toBeDefined();
    });

    it('should allow online captain to toggle duty to OFFLINE with 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/duty')
        .set('x-actor-user-id', captainVerified.id)
        .set('x-actor-role', captainVerified.role)
        .send({ status: DutyStatus.OFFLINE })
        .expect(200);

      expect(res.body.dutyStatus).toBe(DutyStatus.OFFLINE);
      expect(res.body.eligible).toBe(false);

      const dbCheck = await dataSource.query(`
        SELECT "duty_status" FROM "driver_profiles" WHERE "user_id" = '${captainVerified.id}';
      `);
      expect(dbCheck[0].duty_status).toBe(DutyStatus.OFFLINE);
    });
  });

  describe('5. Administrative Suspension & Safety Auto-Offline Guard', () => {
    it('should put captain online first', async () => {
      await request(app.getHttpServer())
        .post('/v1/captains/me/duty')
        .set('x-actor-user-id', captainVerified.id)
        .set('x-actor-role', captainVerified.role)
        .send({ status: DutyStatus.ONLINE })
        .expect(200);
    });

    it('should allow operator to suspend online driver, automatically forcing duty to OFFLINE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/captains/${captainVerified.id}/compliance/status`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          status: DriverComplianceStatus.SUSPENDED,
          suspensionReason: 'Customer safety dispute under review',
          notes: 'Temporary hold pending telematics review',
        })
        .expect(200);

      expect(res.body.complianceStatus).toBe(DriverComplianceStatus.SUSPENDED);
      expect(res.body.isEligibleForAssignment).toBe(false);

      // Verify driver profile in DB: status is SUSPENDED and duty_status is forced to OFFLINE
      const dbCheck = await dataSource.query(`
        SELECT "verification_status", "duty_status", "suspension_reason"
        FROM "driver_profiles" WHERE "user_id" = '${captainVerified.id}';
      `);
      expect(dbCheck[0].verification_status).toBe(DriverComplianceStatus.SUSPENDED);
      expect(dbCheck[0].duty_status).toBe(DutyStatus.OFFLINE);
      expect(dbCheck[0].suspension_reason).toBe('Customer safety dispute under review');
    });

    it('should prevent newly suspended driver from going online again', async () => {
      await request(app.getHttpServer())
        .post('/v1/captains/me/duty')
        .set('x-actor-user-id', captainVerified.id)
        .set('x-actor-role', captainVerified.role)
        .send({ status: DutyStatus.ONLINE })
        .expect(422);
    });
  });

  describe('6. Security & Cross-Account Isolation', () => {
    it('should reject non-operator from accessing another captain’s compliance data with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get(`/v1/captains/${captainVerified.id}/compliance`)
        .set('x-actor-user-id', captainSuspended.id)
        .set('x-actor-role', captainSuspended.role)
        .expect(403);
    });

    it('should reject regular captain from changing compliance status with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/v1/captains/${captainSuspended.id}/compliance/status`)
        .set('x-actor-user-id', captainVerified.id)
        .set('x-actor-role', captainVerified.role)
        .send({ status: DriverComplianceStatus.VERIFIED })
        .expect(403);
    });
  });
});
