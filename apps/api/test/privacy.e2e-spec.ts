import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import {
  PlatformRole,
  ConsentType,
  PolicyVersionDto,
  StatutoryRetentionExceptionDto,
} from '@ecoride/contracts';

describe('Privacy, Consent & Deletion Workflows E2E Integration (EV-020)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const riderAId = 'a1000000-0000-0000-0000-000000000001';
  const riderBId = 'a1000000-0000-0000-0000-000000000002';
  const supportId = 'a1000000-0000-0000-0000-000000000071';

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
      // Seed test users
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES
          ('${riderAId}', '+919123490001', 'RIDER', 'Ananya Vizag Commuter', true),
          ('${riderBId}', '+919123490002', 'RIDER', 'Suresh Gajuwaka Commuter', true),
          ('${supportId}', '+919123490071', 'SUPPORT', 'Ramesh Support Agent', true)
        ON CONFLICT ("id") DO UPDATE
        SET "name" = EXCLUDED."name", "is_active" = true, "phone" = EXCLUDED."phone";

        INSERT INTO "rider_profiles" ("user_id", "preferred_language", "preferred_payment_mode", "accessibility_needs")
        VALUES
          ('${riderAId}', 'te', 'UPI', false),
          ('${riderBId}', 'en', 'UPI', false)
        ON CONFLICT ("user_id") DO NOTHING;

        DELETE FROM "consents" WHERE "user_id" IN ('${riderAId}', '${riderBId}');
        DELETE FROM "data_deletion_requests" WHERE "user_id" IN ('${riderAId}', '${riderBId}');
        DELETE FROM "saved_locations" WHERE "user_id" IN ('${riderAId}', '${riderBId}');
        DELETE FROM "bookings" WHERE "rider_id" IN ('${riderAId}', '${riderBId}');
      `);
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query(`
        DELETE FROM "consents" WHERE "user_id" IN ('${riderAId}', '${riderBId}');
        DELETE FROM "data_deletion_requests" WHERE "user_id" IN ('${riderAId}', '${riderBId}');
        DELETE FROM "saved_locations" WHERE "user_id" IN ('${riderAId}', '${riderBId}');
        DELETE FROM "bookings" WHERE "rider_id" IN ('${riderAId}', '${riderBId}');
      `);
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Platform Policy Versions & Notices', () => {
    it('GET /v1/privacy/policies should return all platform policy versions and metadata', async () => {
      const res = await request(app.getHttpServer()).get('/v1/privacy/policies').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(6);

      const terms = res.body.find(
        (p: PolicyVersionDto) => p.policyType === ConsentType.TERMS_OF_SERVICE,
      );
      expect(terms).toBeDefined();
      expect(terms.isMandatory).toBe(true);
      expect(terms.version).toBe('v1.2');

      const privacy = res.body.find(
        (p: PolicyVersionDto) => p.policyType === ConsentType.PRIVACY_POLICY,
      );
      expect(privacy).toBeDefined();
      expect(privacy.isMandatory).toBe(true);
      expect(privacy.title).toContain('Commuter Privacy Notice');

      const smsMarketing = res.body.find(
        (p: PolicyVersionDto) => p.policyType === ConsentType.COMMUNICATIONS_MARKETING_SMS,
      );
      expect(smsMarketing).toBeDefined();
      expect(smsMarketing.isMandatory).toBe(false);

      const nearbyOffers = res.body.find(
        (p: PolicyVersionDto) => p.policyType === ConsentType.LOCATION_NEARBY_OFFERS,
      );
      expect(nearbyOffers).toBeDefined();
      expect(nearbyOffers.isMandatory).toBe(false);
    });
  });

  describe('2. Consent Capture, Opt-In & Revocation', () => {
    it('POST /v1/privacy/consents should record mandatory terms acceptance', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/privacy/consents')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          consentType: ConsentType.TERMS_OF_SERVICE,
          consentVersion: 'v1.2',
          isGranted: true,
        })
        .expect(201);

      expect(res.body.consentType).toBe(ConsentType.TERMS_OF_SERVICE);
      expect(res.body.consentVersion).toBe('v1.2');
      expect(res.body.isGranted).toBe(true);
    });

    it('POST /v1/privacy/consents should record optional promotional SMS opt-in', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/privacy/consents')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
          consentVersion: 'v1.0',
          isGranted: true,
        })
        .expect(201);

      expect(res.body.consentType).toBe(ConsentType.COMMUNICATIONS_MARKETING_SMS);
      expect(res.body.isGranted).toBe(true);
    });

    it('GET /v1/privacy/consents should return recorded consents for authenticated commuter', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/privacy/consents')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('3. DEMONSTRATE ACCEPTANCE: Revoked Optional Permissions Are Respected', () => {
    it('should affirm MARKETING_SMS permission is allowed when actively granted', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/privacy/evaluate-permission')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({ permission: 'MARKETING_SMS' })
        .expect(200);

      expect(res.body.isAllowed).toBe(true);
      expect(res.body.consentStatus).toBe('GRANTED');
      expect(res.body.reason).toContain('Active consent granted');
    });

    it('POST /v1/privacy/consents/revoke should revoke optional promotional SMS consent', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/privacy/consents/revoke')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
          reason: 'Reducing message volume',
        })
        .expect(200);

      expect(res.body.consentType).toBe(ConsentType.COMMUNICATIONS_MARKETING_SMS);
      expect(res.body.isGranted).toBe(false);
      expect(res.body.revokedAt).toBeDefined();
    });

    it('DEMONSTRATE ACCEPTANCE: evaluate-permission should report isAllowed=false after optional consent was revoked', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/privacy/evaluate-permission')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({ permission: 'MARKETING_SMS' })
        .expect(200);

      // Demonstrates acceptance: Revoked optional permissions are strictly respected
      expect(res.body.isAllowed).toBe(false);
      expect(res.body.consentStatus).toBe('REVOKED');
      expect(res.body.reason).toContain('explicitly revoked');
    });

    it('evaluate-permission should report isAllowed=false when optional permission was never granted', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/privacy/evaluate-permission')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({ permission: 'LOCATION_NEARBY_OFFERS' })
        .expect(200);

      expect(res.body.isAllowed).toBe(false);
      expect(res.body.consentStatus).toBe('NOT_RECORDED');
      expect(res.body.reason).toContain('Opt-in is required');
    });
  });

  describe('4. Personal Data Export Workflow (DPDP Act Data Portability)', () => {
    beforeAll(async () => {
      // Add a saved location for Rider A
      await dataSource.query(`
        INSERT INTO "saved_locations" ("user_id", "label", "address_type", "address_line", "latitude", "longitude")
        VALUES ('${riderAId}', 'Home', 'PICKUP', 'Siripuram, Visakhapatnam', 17.7212, 83.3155);
      `);
    });

    it('POST /v1/privacy/export should return structured export of commuter personal data', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/privacy/export')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(res.body.exportId).toBeDefined();
      expect(res.body.statutoryBasis).toContain('Digital Personal Data Protection');
      expect(res.body.user.phoneMasked).toBe('+91*****0001');
      expect(res.body.user.name).toBe('Ananya Vizag Commuter');
      expect(res.body.riderProfile.preferredLanguage).toBe('te');
      expect(Array.isArray(res.body.consents)).toBe(true);
      expect(Array.isArray(res.body.savedLocations)).toBe(true);
      expect(res.body.savedLocations.length).toBeGreaterThanOrEqual(1);

      // Verify audit event recorded in database
      const auditRes = await dataSource.query(`
        SELECT "action", "status" FROM "audit_events" 
        WHERE "target_user_id" = '${riderAId}' AND "action" = 'DATA_EXPORT_REQUESTED';
      `);
      expect(auditRes.length).toBeGreaterThanOrEqual(1);
      expect(auditRes[0].status).toBe('SUCCESS');
    });

    it('Rider A cannot export Rider B data (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/v1/privacy/users/${riderBId}/data-export`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(403);
    });
  });

  describe('5. Data Deletion Workflow & Mandatory Retention Exceptions', () => {
    let activeBookingId: string;

    it('RETENTION EXCEPTION: should reject deletion request when an active trip is in progress (422 Unprocessable)', async () => {
      // Create an active booking for Rider A
      const insertBooking = await dataSource.query(`
        INSERT INTO "bookings" (
          "booking_code", "rider_id", "service_category", "status", 
          "pickup_location", "dropoff_location", "fare_amount"
        ) VALUES (
          'BK-ACT-TEST-001', '${riderAId}', 'PRIVATE_EV', 'IN_PROGRESS',
          ST_SetSRID(ST_MakePoint(83.3155, 17.7212), 4326),
          ST_SetSRID(ST_MakePoint(83.3255, 17.7312), 4326),
          125.00
        ) RETURNING "id";
      `);
      activeBookingId = insertBooking[0].id;

      const res = await request(app.getHttpServer())
        .post('/v1/privacy/deletion-request')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          reason: 'Leaving platform',
          confirmUnderstandRetention: true,
        })
        .expect(422);

      expect(res.body.error.code).toBe('ACTIVE_RIDE_BLOCKS_DELETION');
      expect(res.body.error.message).toContain('Active ride in progress');
      expect(res.body.error.message).toContain('BK-ACT-TEST-001');

      // Verify audit event recorded as REJECTED / DENIED
      const auditRes = await dataSource.query(`
        SELECT "action", "status", "failure_reason" FROM "audit_events"
        WHERE "target_user_id" = '${riderAId}' AND "action" = 'DATA_DELETION_REJECTED';
      `);
      expect(auditRes.length).toBeGreaterThanOrEqual(1);
      expect(auditRes[0].status).toBe('DENIED');
      expect(auditRes[0].failure_reason).toContain('BK-ACT-TEST-001');
    });

    it('should reject deletion request when commuter does not confirm retention understanding', async () => {
      await request(app.getHttpServer())
        .post('/v1/privacy/deletion-request')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          reason: 'Leaving platform',
          confirmUnderstandRetention: false,
        })
        .expect(400);
    });

    it('DEMONSTRATE ACCEPTANCE: should execute erasure and disclose mandatory retention reasons when eligible', async () => {
      // Complete the active booking so retention blocking condition is resolved
      await dataSource.query(`
        UPDATE "bookings" SET "status" = 'COMPLETED' WHERE "id" = '${activeBookingId}';
      `);

      const res = await request(app.getHttpServer())
        .post('/v1/privacy/deletion-request')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          reason: 'Relocating to Hyderabad',
          confirmUnderstandRetention: true,
        })
        .expect(200);

      // 1. Verify status and erased items
      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.erasedAt).toBeDefined();
      expect(res.body.erasedItems).toEqual(
        expect.arrayContaining([
          'RIDER_PROFILE_PERSONAL_PREFERENCES',
          'SAVED_PICKUP_AND_DROP_LOCATIONS',
          'ACTIVE_DEVICE_SESSIONS',
          'OPTIONAL_COMMUNICATION_CONSENTS',
          'CONTACT_PHONE_AND_EMAIL_PSEUDONYMIZED',
        ]),
      );

      // 2. DEMONSTRATE ACCEPTANCE: Mandatory retention reasons are transparently disclosed
      expect(res.body.mandatoryRetentionExceptions).toBeDefined();
      expect(res.body.mandatoryRetentionExceptions.length).toBe(2);

      const taxException = res.body.mandatoryRetentionExceptions.find(
        (e: StatutoryRetentionExceptionDto) => e.category === 'FINANCIAL_TRANSACTIONS_AND_TAX',
      );
      expect(taxException).toBeDefined();
      expect(taxException.retentionPeriod).toContain('8 years');
      expect(taxException.statutoryBasis).toContain('Companies Act, 2013');

      const safetyException = res.body.mandatoryRetentionExceptions.find(
        (e: StatutoryRetentionExceptionDto) => e.category === 'TRANSPORT_SAFETY_AND_INCIDENT_AUDIT',
      );
      expect(safetyException).toBeDefined();
      expect(safetyException.retentionPeriod).toContain('3 years');
      expect(safetyException.statutoryBasis).toContain('Motor Vehicles Act');

      expect(res.body.disclosure).toContain('Digital Personal Data Protection');
      expect(res.body.disclosure).toContain('statutory retention periods');

      // 3. Verify database side-effects (erasure & pseudonymization)
      const userDb = await dataSource.query(`
        SELECT "is_active", "name", "phone", "email" FROM "users" WHERE "id" = '${riderAId}';
      `);
      expect(userDb[0].is_active).toBe(false);
      expect(userDb[0].name).toBe('DELETED_COMMUTER');
      expect(userDb[0].phone).toContain('del_');
      expect(userDb[0].email).toBeNull();

      // Verify saved locations purged
      const locationsDb = await dataSource.query(`
        SELECT COUNT(*) as count FROM "saved_locations" WHERE "user_id" = '${riderAId}';
      `);
      expect(parseInt(locationsDb[0].count, 10)).toBe(0);

      // Verify audit event recorded
      const auditRes = await dataSource.query(`
        SELECT "action", "status" FROM "audit_events"
        WHERE "target_user_id" = '${riderAId}' AND "action" = 'DATA_DELETION_PROCESSED';
      `);
      expect(auditRes.length).toBeGreaterThanOrEqual(1);
      expect(auditRes[0].status).toBe('SUCCESS');
    });

    it('Rider A cannot delete Rider B account (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/v1/privacy/users/${riderBId}/deletion-request`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          reason: 'Unauthorized deletion attempt',
          confirmUnderstandRetention: true,
        })
        .expect(403);
    });
  });
});
