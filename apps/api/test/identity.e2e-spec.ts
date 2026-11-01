import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { PlatformRole } from '@ecoride/contracts';

describe('Identity, Role Scopes & Ownership Enforcement (E2E Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const riderAId = 'a0000001-0000-0000-0000-000000000001';
  const riderBId = 'a0000001-0000-0000-0000-000000000002';
  const supportAdminId = 'c0000001-0000-0000-0000-000000000071';
  const superAdminId = 'c0000001-0000-0000-0000-000000000099';

  beforeAll(async () => {
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

    // Ensure database schema migration 3 is applied if running against live DB
    if (dataSource.isInitialized) {
      await dataSource.query(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" VARCHAR(150) UNIQUE;
        CREATE TABLE IF NOT EXISTS "roles" (
          "id" VARCHAR(50) PRIMARY KEY,
          "name" VARCHAR(100) NOT NULL,
          "description" TEXT,
          "scopes" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "is_system" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS "rider_profiles" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
          "emergency_contact_name" VARCHAR(100),
          "emergency_contact_phone" VARCHAR(20),
          "preferred_payment_mode" VARCHAR(50) NOT NULL DEFAULT 'CASH_OR_UPI',
          "default_pickup_notes" TEXT,
          "accessibility_needs" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS "driver_profiles" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
          "license_number" VARCHAR(50) NOT NULL UNIQUE,
          "badge_number" VARCHAR(50),
          "verification_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          "green_plate_permit_verified" BOOLEAN NOT NULL DEFAULT false,
          "safety_training_completed" BOOLEAN NOT NULL DEFAULT false,
          "city" VARCHAR(50) NOT NULL DEFAULT 'visakhapatnam',
          "assigned_vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL,
          "rating_average" NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
          "total_trips" INT NOT NULL DEFAULT 0,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS "sessions" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "token_hash" VARCHAR(128) NOT NULL UNIQUE,
          "device_id" VARCHAR(100),
          "platform" VARCHAR(30) NOT NULL DEFAULT 'WEB',
          "ip_address" VARCHAR(45),
          "user_agent" VARCHAR(255),
          "is_revoked" BOOLEAN NOT NULL DEFAULT false,
          "expires_at" TIMESTAMPTZ NOT NULL,
          "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS "consents" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "consent_type" VARCHAR(50) NOT NULL,
          "consent_version" VARCHAR(20) NOT NULL,
          "is_granted" BOOLEAN NOT NULL DEFAULT true,
          "ip_address" VARCHAR(45),
          "user_agent" VARCHAR(255),
          "granted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "revoked_at" TIMESTAMPTZ,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT "uq_user_consent_type_version" UNIQUE ("user_id", "consent_type", "consent_version")
        );
        CREATE TABLE IF NOT EXISTS "audit_events" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
          "target_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
          "action" VARCHAR(100) NOT NULL,
          "entity_type" VARCHAR(50) NOT NULL,
          "entity_id" VARCHAR(100) NOT NULL,
          "previous_state" JSONB,
          "new_state" JSONB,
          "ip_address" VARCHAR(45),
          "correlation_id" VARCHAR(100),
          "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
          "failure_reason" TEXT,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Ensure test users exist
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES
          ('${riderAId}', '+919123400001', 'RIDER', 'Kavya Sharma (Rider A)', true),
          ('${riderBId}', '+919123400002', 'RIDER', 'Ravi Teja (Rider B)', true),
          ('${supportAdminId}', '+919123400071', 'SUPPORT', 'Vikas Support Agent', true),
          ('${superAdminId}', '+919123400099', 'SUPER_ADMIN', 'Platform Executive SuperAdmin', true)
        ON CONFLICT ("id") DO UPDATE
        SET "role" = EXCLUDED."role", "name" = EXCLUDED."name";
      `);
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /v1/identity/roles should return defined roles and permissions', async () => {
    const res = await request(app.getHttpServer()).get('/v1/identity/roles').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /v1/identity/users/:userId/profile should return user profile for self (ownership)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/identity/users/${riderAId}/profile`)
      .set('x-actor-user-id', riderAId)
      .set('x-actor-role', PlatformRole.RIDER)
      .expect(200);

    expect(res.body.id).toBe(riderAId);
    expect(res.body.role).toBe(PlatformRole.RIDER);
  });

  it('DEMONSTRATE ACCEPTANCE: Unauthorized cross-account data access fails with 403 Forbidden', async () => {
    // Rider A attempts to read Rider B's private account data
    const res = await request(app.getHttpServer())
      .get(`/v1/identity/users/${riderBId}/profile`)
      .set('x-actor-user-id', riderAId)
      .set('x-actor-role', PlatformRole.RIDER)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('Access denied');

    // Verify cross-account security audit event persisted in database
    const audits = await dataSource.query(`
      SELECT * FROM "audit_events"
      WHERE "actor_id" = '${riderAId}' AND "action" = 'CROSS_ACCOUNT_ACCESS_DENIED'
      ORDER BY "created_at" DESC LIMIT 1;
    `);

    expect(audits.length).toBe(1);
    expect(audits[0].status).toBe('DENIED');
    expect(audits[0].target_user_id).toBe(riderBId);
  });

  it('GET /v1/identity/users/:userId/profile should allow SUPPORT agent to view profile', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/identity/users/${riderAId}/profile`)
      .set('x-actor-user-id', supportAdminId)
      .set('x-actor-role', PlatformRole.SUPPORT)
      .expect(200);

    expect(res.body.id).toBe(riderAId);
  });

  it('DEMONSTRATE ACCEPTANCE: Non-admin role modification fails with 403 Forbidden and logs security audit', async () => {
    // Rider A attempts to promote themselves to SUPER_ADMIN
    const res = await request(app.getHttpServer())
      .post(`/v1/identity/users/${riderAId}/role`)
      .set('x-actor-user-id', riderAId)
      .set('x-actor-role', PlatformRole.RIDER)
      .send({ newRole: PlatformRole.SUPER_ADMIN, reason: 'Unauthorized privilege escalation' })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');

    // Verify denial audit event recorded in database
    const audits = await dataSource.query(`
      SELECT * FROM "audit_events"
      WHERE "actor_id" = '${riderAId}' AND "action" = 'ROLE_CHANGE_DENIED'
      ORDER BY "created_at" DESC LIMIT 1;
    `);

    expect(audits.length).toBe(1);
    expect(audits[0].status).toBe('DENIED');
  });

  it('DEMONSTRATE ACCEPTANCE: SUPER_ADMIN modifies user role and change is fully audited', async () => {
    // SuperAdmin updates Rider B to SUPPORT specialist
    const res = await request(app.getHttpServer())
      .post(`/v1/identity/users/${riderBId}/role`)
      .set('x-actor-user-id', superAdminId)
      .set('x-actor-role', PlatformRole.SUPER_ADMIN)
      .send({
        newRole: PlatformRole.SUPPORT,
        reason: 'Promoted to Customer Support agent in Visakhapatnam Hub',
      })
      .expect(201);

    expect(res.body.userId).toBe(riderBId);
    expect(res.body.previousRole).toBe(PlatformRole.RIDER);
    expect(res.body.newRole).toBe(PlatformRole.SUPPORT);

    // Verify user table updated
    const user = await dataSource.query(`SELECT "role" FROM "users" WHERE "id" = '${riderBId}';`);
    expect(user[0].role).toBe(PlatformRole.SUPPORT);

    // Verify authoritative audit trail recorded in database
    const audits = await dataSource.query(`
      SELECT * FROM "audit_events"
      WHERE "target_user_id" = '${riderBId}' AND "action" = 'ROLE_CHANGED'
      ORDER BY "created_at" DESC LIMIT 1;
    `);

    expect(audits.length).toBe(1);
    expect(audits[0].actor_id).toBe(superAdminId);
    expect(audits[0].previous_state.role).toBe(PlatformRole.RIDER);
    expect(audits[0].new_state.role).toBe(PlatformRole.SUPPORT);
    expect(audits[0].new_state.reason).toContain('Visakhapatnam Hub');
    expect(audits[0].status).toBe('SUCCESS');
  });

  it('POST /v1/identity/users/:userId/consents should record privacy consent', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/identity/users/${riderAId}/consents`)
      .set('x-actor-user-id', riderAId)
      .set('x-actor-role', PlatformRole.RIDER)
      .send({
        consentType: 'LOCATION_TRACKING',
        consentVersion: 'v1.0',
        isGranted: true,
      })
      .expect(201);

    expect(res.body.consentType).toBe('LOCATION_TRACKING');
    expect(res.body.isGranted).toBe(true);

    // Cross-account consent recording by another rider should fail with 403
    await request(app.getHttpServer())
      .post(`/v1/identity/users/${riderBId}/consents`)
      .set('x-actor-user-id', riderAId)
      .set('x-actor-role', PlatformRole.RIDER)
      .send({
        consentType: 'TERMS_OF_SERVICE',
        consentVersion: 'v1.0',
        isGranted: true,
      })
      .expect(403);
  });
});
