import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import {
  PlatformRole,
  CaptainApplicationStatus,
  RequirementStatus,
  VehicleOwnershipType,
  VehicleCategory,
  PropulsionType,
} from '@ecoride/contracts';

describe('Captain Application & Document Verification E2E Integration (EV-024)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const captainA = {
    id: 'f1000000-0000-4000-8000-000000000001',
    phone: '+919876240001',
    role: PlatformRole.RIDER,
    name: 'Venkata Ramana (Captain Applicant)',
  };

  const captainB = {
    id: 'f2000000-0000-4000-8000-000000000002',
    phone: '+919876240002',
    role: PlatformRole.RIDER,
    name: 'Kalyan Commuter',
  };

  const operatorUser = {
    id: 'f3000000-0000-4000-8000-000000000003',
    phone: '+919876240003',
    role: PlatformRole.OPERATOR,
    name: 'Anusha Fleet Operations Officer',
  };

  // Seeded mock document IDs
  const licenseDocId = 'd1000000-0000-4000-8000-000000000001';
  const aadhaarDocId = 'd1000000-0000-4000-8000-000000000002';
  const rcDocId = 'd1000000-0000-4000-8000-000000000003';
  const permitDocId = 'd1000000-0000-4000-8000-000000000004';

  let applicationId: string;

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
      // Clean up previous test artifacts
      await dataSource.query(`
        DELETE FROM "captain_application_reviews" WHERE "reviewer_id" = '${operatorUser.id}' OR "application_id" IN (
          SELECT "id" FROM "captain_applications" WHERE "user_id" IN ('${captainA.id}', '${captainB.id}')
        );
        DELETE FROM "captain_applications" WHERE "user_id" IN ('${captainA.id}', '${captainB.id}');
        DELETE FROM "driver_profiles" WHERE "user_id" IN ('${captainA.id}', '${captainB.id}') OR "license_number" IN ('AP31 20240008899', 'AP31 20210008899');
        DELETE FROM "vehicles" WHERE "owner_id" IN ('${captainA.id}', '${captainB.id}') OR "registration_number" IN ('AP31EV2424', 'AP31EV7788');
        DELETE FROM "documents" WHERE "id" IN ('${licenseDocId}', '${aadhaarDocId}', '${rcDocId}', '${permitDocId}');
        DELETE FROM "users" WHERE "id" IN ('${captainA.id}', '${captainB.id}', '${operatorUser.id}') OR "phone" IN ('${captainA.phone}', '${captainB.phone}', '${operatorUser.phone}');
      `);

      // Seed users
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES
          ('${captainA.id}', '${captainA.phone}', '${captainA.role}', '${captainA.name}', true),
          ('${captainB.id}', '${captainB.phone}', '${captainB.role}', '${captainB.name}', true),
          ('${operatorUser.id}', '${operatorUser.phone}', '${operatorUser.role}', '${operatorUser.name}', true);
      `);

      // Seed verified KYC documents for captainA
      await dataSource.query(`
        INSERT INTO "documents" ("id", "user_id", "document_type", "original_filename", "storage_key", "mime_type", "file_size_bytes", "sha256_checksum", "scan_status")
        VALUES
          ('${licenseDocId}', '${captainA.id}', 'DRIVING_LICENSE', 'license.jpg', 'kyc/lic.jpg', 'image/jpeg', 102400, 'sha256_dummy_lic', 'CLEAN'),
          ('${aadhaarDocId}', '${captainA.id}', 'AADHAAR', 'aadhaar.pdf', 'kyc/aadh.pdf', 'application/pdf', 204800, 'sha256_dummy_aadh', 'CLEAN'),
          ('${rcDocId}', '${captainA.id}', 'VEHICLE_RC', 'rc.jpg', 'kyc/rc.jpg', 'image/jpeg', 102400, 'sha256_dummy_rc', 'CLEAN'),
          ('${permitDocId}', '${captainA.id}', 'GREEN_PLATE_PERMIT', 'permit.pdf', 'kyc/perm.pdf', 'application/pdf', 153600, 'sha256_dummy_perm', 'CLEAN');
      `);
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query(`
        DELETE FROM "captain_application_reviews" WHERE "reviewer_id" = '${operatorUser.id}' OR "application_id" IN (
          SELECT "id" FROM "captain_applications" WHERE "user_id" IN ('${captainA.id}', '${captainB.id}')
        );
        DELETE FROM "captain_applications" WHERE "user_id" IN ('${captainA.id}', '${captainB.id}');
        DELETE FROM "driver_profiles" WHERE "user_id" IN ('${captainA.id}', '${captainB.id}') OR "license_number" IN ('AP31 20240008899', 'AP31 20210008899');
        DELETE FROM "vehicles" WHERE "owner_id" IN ('${captainA.id}', '${captainB.id}') OR "registration_number" IN ('AP31EV2424', 'AP31EV7788');
        DELETE FROM "documents" WHERE "id" IN ('${licenseDocId}', '${aadhaarDocId}', '${rcDocId}', '${permitDocId}');
        DELETE FROM "users" WHERE "id" IN ('${captainA.id}', '${captainB.id}', '${operatorUser.id}');
      `);
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Draft Data Persists Across Calls', () => {
    it('should initialize a blank application draft for applicant with 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captain-applications/me')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.userId).toBe(captainA.id);
      expect(res.body.status).toBe(CaptainApplicationStatus.DRAFT);
      expect(res.body.submissionCount).toBe(0);

      applicationId = res.body.id;
    });

    it('should update partial draft fields and persist changes reliably across calls', async () => {
      // Save draft progress
      await request(app.getHttpServer())
        .put('/v1/captain-applications/me')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .send({
          fullName: 'Venkata Ramana',
          drivingLicenseNumber: 'AP31 20240008899',
          emergencyContactName: 'Satya Murthy',
          emergencyContactPhone: '+919876543210',
          vehicleOwnershipType: VehicleOwnershipType.OWNED,
          vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
          vehicleMake: 'Ather Energy',
          vehicleModel: '450X',
          city: 'visakhapatnam',
        })
        .expect(200);

      // Re-fetch to demonstrate draft persistence
      const getRes = await request(app.getHttpServer())
        .get('/v1/captain-applications/me')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .expect(200);

      expect(getRes.body.id).toBe(applicationId);
      expect(getRes.body.fullName).toBe('Venkata Ramana');
      expect(getRes.body.drivingLicenseNumber).toBe('AP31 20240008899');
      expect(getRes.body.vehicleMake).toBe('Ather Energy');
      expect(getRes.body.city).toBe('visakhapatnam');
      expect(getRes.body.status).toBe(CaptainApplicationStatus.DRAFT);
    });
  });

  describe('2. Field Validation & Electric-Only Propulsion Enforcement', () => {
    it('should reject application submission when mandatory documents are missing with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captain-applications/me/submit')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .send()
        .expect(400);

      expect(res.body.error.message).toContain('Application submission failed');
    });

    it('should reject non-electric vehicle propulsion specifications with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .put('/v1/captain-applications/me')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .send({
          propulsionType: 'DIESEL',
        })
        .expect(400);

      expect(res.body.error.message).toContain(
        "Non-electric propulsion 'DIESEL' is strictly prohibited",
      );
    });

    it('should complete draft with all required documents and submit successfully with 200 OK', async () => {
      // Attach all required document IDs and vehicle registration
      await request(app.getHttpServer())
        .put('/v1/captain-applications/me')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .send({
          drivingLicenseDocId: licenseDocId,
          aadhaarDocId: aadhaarDocId,
          vehicleRegistrationNumber: 'AP31EV7788',
          vehicleRcDocId: rcDocId,
          greenPlatePermitDocId: permitDocId,
          propulsionType: PropulsionType.BATTERY_ELECTRIC,
        })
        .expect(200);

      // Submit application
      const submitRes = await request(app.getHttpServer())
        .post('/v1/captain-applications/me/submit')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .send({
          notes: 'AP Green plate electric bike ready for verification',
        })
        .expect(200);

      expect(submitRes.body.status).toBe(CaptainApplicationStatus.SUBMITTED);
      expect(submitRes.body.submissionCount).toBe(1);
      expect(submitRes.body.submittedAt).toBeDefined();
    });
  });

  describe('3. Submitted Data Appears Exactly in Admin', () => {
    it('should return submitted application in admin listing with 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captain-applications?status=SUBMITTED&city=visakhapatnam')
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.some((item: { id: string }) => item.id === applicationId)).toBe(true);
    });

    it('should return exact submitted details and document references when queried by admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/captain-applications/${applicationId}`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .expect(200);

      expect(res.body.id).toBe(applicationId);
      expect(res.body.userId).toBe(captainA.id);
      expect(res.body.fullName).toBe('Venkata Ramana');
      expect(res.body.drivingLicenseNumber).toBe('AP31 20240008899');
      expect(res.body.drivingLicenseDocId).toBe(licenseDocId);
      expect(res.body.aadhaarDocId).toBe(aadhaarDocId);
      expect(res.body.vehicleRegistrationNumber).toBe('AP31EV7788');
      expect(res.body.vehicleMake).toBe('Ather Energy');
      expect(res.body.vehicleRcDocId).toBe(rcDocId);
      expect(res.body.greenPlatePermitDocId).toBe(permitDocId);
      expect(res.body.reviewHistory).toHaveLength(1);
      expect(res.body.reviewHistory[0].newStatus).toBe(CaptainApplicationStatus.SUBMITTED);
    });
  });

  describe('4. Rejected Applications are Editable Without Duplicate Records', () => {
    it('should allow operator to reject vehicle requirement while approving driver requirement', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/captain-applications/${applicationId}/review`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          overallStatus: CaptainApplicationStatus.REJECTED,
          driverRequirementsStatus: RequirementStatus.APPROVED,
          vehicleRequirementsStatus: RequirementStatus.REJECTED,
          vehicleRejectionReason:
            'Vehicle RC document photo was blurry. Please re-upload clear scan.',
          notes: 'Driver KYC passed; please upload clearer photo of Vehicle RC.',
        })
        .expect(200);

      expect(res.body.status).toBe(CaptainApplicationStatus.REJECTED);
      expect(res.body.driverRequirementsStatus).toBe(RequirementStatus.APPROVED);
      expect(res.body.vehicleRequirementsStatus).toBe(RequirementStatus.REJECTED);
      expect(res.body.vehicleRejectionReason).toContain('blurry');
    });

    it('should allow captain to edit rejected application on the exact same record', async () => {
      // Captain edits their rejected application with corrected vehicle model details
      const editRes = await request(app.getHttpServer())
        .put('/v1/captain-applications/me')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .send({
          vehicleModel: '450X Gen 3 High Clarity',
        })
        .expect(200);

      // Verify ID is unchanged (NO DUPLICATE RECORD CREATED)
      expect(editRes.body.id).toBe(applicationId);
      expect(editRes.body.vehicleModel).toBe('450X Gen 3 High Clarity');

      // Verify in database that exactly one application exists for this user
      const dbCount = await dataSource.query(`
        SELECT COUNT(*) as count FROM "captain_applications" WHERE "user_id" = '${captainA.id}';
      `);
      expect(Number(dbCount[0].count)).toBe(1);
    });

    it('should resubmit application, increment submissionCount to 2, and append to review history', async () => {
      const resubmitRes = await request(app.getHttpServer())
        .post('/v1/captain-applications/me/submit')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .send({
          notes: 'Re-uploaded clearer vehicle documents',
        })
        .expect(200);

      expect(resubmitRes.body.id).toBe(applicationId);
      expect(resubmitRes.body.status).toBe(CaptainApplicationStatus.SUBMITTED);
      expect(resubmitRes.body.submissionCount).toBe(2);

      // Verify review history has 3 entries: initial submit -> reject -> resubmit
      const historyRes = await request(app.getHttpServer())
        .get('/v1/captain-applications/me/history')
        .set('x-actor-user-id', captainA.id)
        .set('x-actor-role', captainA.role)
        .expect(200);

      expect(Array.isArray(historyRes.body)).toBe(true);
      expect(historyRes.body.length).toBeGreaterThanOrEqual(3);
      expect(historyRes.body[0].newStatus).toBe(CaptainApplicationStatus.SUBMITTED);
      expect(historyRes.body[1].newStatus).toBe(CaptainApplicationStatus.REJECTED);
      expect(historyRes.body[2].newStatus).toBe(CaptainApplicationStatus.SUBMITTED);
    });
  });

  describe('5. Full Approval & Independent Requirements Satisfaction', () => {
    it('should allow operator to fully approve application when both requirements are satisfied', async () => {
      const approveRes = await request(app.getHttpServer())
        .post(`/v1/captain-applications/${applicationId}/review`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          overallStatus: CaptainApplicationStatus.APPROVED,
          driverRequirementsStatus: RequirementStatus.APPROVED,
          vehicleRequirementsStatus: RequirementStatus.APPROVED,
          notes: 'All documents verified; AP Green plate confirmed.',
        })
        .expect(200);

      expect(approveRes.body.status).toBe(CaptainApplicationStatus.APPROVED);
      expect(approveRes.body.driverRequirementsStatus).toBe(RequirementStatus.APPROVED);
      expect(approveRes.body.vehicleRequirementsStatus).toBe(RequirementStatus.APPROVED);

      // Verify user promoted to CAPTAIN in users table
      const userRes = await dataSource.query(`
        SELECT "role" FROM "users" WHERE "id" = '${captainA.id}';
      `);
      expect(userRes[0].role).toBe(PlatformRole.CAPTAIN);

      // Verify driver_profiles record is VERIFIED
      const driverRes = await dataSource.query(`
        SELECT "verification_status", "assigned_vehicle_id" FROM "driver_profiles" WHERE "user_id" = '${captainA.id}';
      `);
      expect(driverRes[0].verification_status).toBe('VERIFIED');
      expect(driverRes[0].assigned_vehicle_id).toBeDefined();
    });
  });

  describe('6. Security & Cross-Account Isolation', () => {
    it('should prevent Captain B from accessing Captain A’s application details with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get(`/v1/captain-applications/${applicationId}`)
        .set('x-actor-user-id', captainB.id)
        .set('x-actor-role', captainB.role)
        .expect(403);
    });

    it('should prevent regular captains from calling the operator review endpoint with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/v1/captain-applications/${applicationId}/review`)
        .set('x-actor-user-id', captainB.id)
        .set('x-actor-role', captainB.role)
        .send({
          overallStatus: CaptainApplicationStatus.APPROVED,
          driverRequirementsStatus: RequirementStatus.APPROVED,
          vehicleRequirementsStatus: RequirementStatus.APPROVED,
        })
        .expect(403);
    });
  });
});
