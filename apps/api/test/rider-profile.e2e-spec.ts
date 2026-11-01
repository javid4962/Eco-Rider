import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { PlatformRole, SavedAddressType } from '@ecoride/contracts';

describe('Rider Profile & Saved Locations E2E Integration (EV-019)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const riderAId = 'a0000001-0000-0000-0000-000000000001';
  const riderBId = 'a0000001-0000-0000-0000-000000000002';
  const supportAdminId = 'c0000001-0000-0000-0000-000000000071';

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

    // Ensure database migration 5 and test users exist
    if (dataSource.isInitialized) {
      await dataSource.query(`
        ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'te';
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rider_profiles_language') THEN
            ALTER TABLE "rider_profiles" ADD CONSTRAINT "chk_rider_profiles_language" CHECK ("preferred_language" IN ('te', 'en', 'hi'));
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS "saved_locations" (
          "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "label" VARCHAR(50) NOT NULL,
          "address_type" VARCHAR(20) NOT NULL DEFAULT 'BOTH',
          "address_line" VARCHAR(255) NOT NULL,
          "landmark" VARCHAR(100),
          "latitude" NUMERIC(10, 7) NOT NULL,
          "longitude" NUMERIC(10, 7) NOT NULL,
          "location" geometry(Point, 4326),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES
          ('${riderAId}', '+919123400001', 'RIDER', 'Kavya Sharma (Rider A)', true),
          ('${riderBId}', '+919123400002', 'RIDER', 'Ravi Teja (Rider B)', true),
          ('${supportAdminId}', '+919123400071', 'SUPPORT', 'Vikas Support Agent', true)
        ON CONFLICT ("id") DO UPDATE
        SET "role" = EXCLUDED."role", "name" = EXCLUDED."name";

        INSERT INTO "rider_profiles" ("user_id", "preferred_language", "preferred_payment_mode", "accessibility_needs")
        VALUES
          ('${riderAId}', 'te', 'CASH_OR_UPI', false),
          ('${riderBId}', 'en', 'CASH_OR_UPI', false)
        ON CONFLICT ("user_id") DO NOTHING;

        DELETE FROM "saved_locations" WHERE "user_id" IN ('${riderAId}', '${riderBId}');
      `);
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query(
        `DELETE FROM "saved_locations" WHERE "user_id" IN ('${riderAId}', '${riderBId}');`,
      );
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Rider Profile Update & Chosen Language (Telugu/English/Hindi)', () => {
    it('should successfully update chosen language to Telugu (te) and commuter display name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/identity/users/${riderAId}/rider-profile`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          name: 'Kavya Sharma (Vizag Commuter)',
          preferredLanguage: 'te',
          emergencyContactName: 'Anand Sharma',
          emergencyContactPhone: '+919876543210',
          preferredPaymentMode: 'UPI',
          defaultPickupNotes: 'Near main entrance ramp',
          accessibilityNeeds: true,
        })
        .expect(200);

      expect(res.body.preferredLanguage).toBe('te');
      expect(res.body.accessibilityNeeds).toBe(true);
      expect(res.body.emergencyContactName).toBe('Anand Sharma');

      // Verify users table updated display name
      const userRes = await dataSource.query(
        `SELECT "name" FROM "users" WHERE "id" = '${riderAId}';`,
      );
      expect(userRes[0].name).toBe('Kavya Sharma (Vizag Commuter)');

      // Verify audit event recorded
      const audits = await dataSource.query(`
        SELECT * FROM "audit_events"
        WHERE "actor_id" = '${riderAId}' AND "action" = 'RIDER_PROFILE_UPDATED'
        ORDER BY "created_at" DESC LIMIT 1;
      `);
      expect(audits.length).toBe(1);
    });

    it('should reject invalid language choice with 400 Bad Request error envelope', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/identity/users/${riderAId}/rider-profile`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          preferredLanguage: 'fr', // Invalid language code
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('should reject invalid emergency contact phone number format with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/identity/users/${riderAId}/rider-profile`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          emergencyContactPhone: '98765', // Not valid +91 Indian format
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A cannot update Rider B profile (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/identity/users/${riderBId}/rider-profile`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          preferredLanguage: 'en',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Verify denial audit event recorded
      const audits = await dataSource.query(`
        SELECT * FROM "audit_events"
        WHERE "actor_id" = '${riderAId}' AND "action" = 'CROSS_ACCOUNT_ACCESS_DENIED'
        ORDER BY "created_at" DESC LIMIT 1;
      `);
      expect(audits.length).toBe(1);
    });
  });

  describe('2. Saved Pickup/Drop Locations Creation & Validation', () => {
    let createdLocationId: string;

    it('should create a saved PICKUP location with valid coordinates', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/identity/users/${riderAId}/saved-locations`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: 'Beach Road Residence',
          addressType: SavedAddressType.PICKUP,
          addressLine: 'Flat 301, Ocean View Towers, RK Beach Road',
          landmark: 'Opposite Submarine Museum',
          latitude: 17.7126,
          longitude: 83.3182,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.userId).toBe(riderAId);
      expect(res.body.label).toBe('Beach Road Residence');
      expect(res.body.addressType).toBe(SavedAddressType.PICKUP);
      expect(res.body.latitude).toBe(17.7126);
      expect(res.body.longitude).toBe(83.3182);

      createdLocationId = res.body.id;

      // Verify PostGIS spatial point populated in database
      const dbLoc = await dataSource.query(`
        SELECT "label", ST_AsText("location") as geom_text
        FROM "saved_locations"
        WHERE "id" = '${createdLocationId}';
      `);
      expect(dbLoc[0].geom_text).toContain('POINT(83.3182 17.7126)');
    });

    it('should reject invalid coordinates (out-of-range latitude)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/identity/users/${riderAId}/saved-locations`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: 'Invalid Coordinates',
          addressType: SavedAddressType.BOTH,
          addressLine: 'Some Street',
          latitude: 95.0, // Invalid: > 90
          longitude: 83.3182,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid label (empty string)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/identity/users/${riderAId}/saved-locations`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: '',
          addressLine: 'Valid Address Line, MVP Colony',
          latitude: 17.72,
          longitude: 83.32,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Input Limits (Maximum 20 Saved Locations per Rider)', () => {
    it('DEMONSTRATE ACCEPTANCE: should reject 21st location when 20 locations limit is reached', async () => {
      // Clear and insert exactly 20 locations for Rider A
      await dataSource.query(`DELETE FROM "saved_locations" WHERE "user_id" = '${riderAId}';`);

      for (let i = 1; i <= 20; i++) {
        await dataSource.query(`
          INSERT INTO "saved_locations" ("user_id", "label", "address_type", "address_line", "latitude", "longitude")
          VALUES ('${riderAId}', 'Saved Place ${i}', 'BOTH', 'Street ${i}, Visakhapatnam', 17.71 + ${i * 0.001}, 83.31 + ${i * 0.001});
        `);
      }

      // 21st attempt: must be rejected with 400 Bad Request
      const res = await request(app.getHttpServer())
        .post(`/v1/identity/users/${riderAId}/saved-locations`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: '21st Overflow Place',
          addressType: SavedAddressType.BOTH,
          addressLine: 'Dwaraka Nagar 3rd Lane, Visakhapatnam',
          latitude: 17.7255,
          longitude: 83.3122,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain(
        'Maximum limit of 20 saved locations per rider reached',
      );
    });
  });

  describe('4. Pagination & Filtering on Saved Locations', () => {
    it('DEMONSTRATE ACCEPTANCE: should return page 1 with limit 10 and correct pagination envelope', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderAId}/saved-locations?page=1&limit=10`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(res.body.total).toBe(20);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.items.length).toBe(10);
    });

    it('DEMONSTRATE ACCEPTANCE: should return page 2 with remaining 10 items', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderAId}/saved-locations?page=2&limit=10`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(res.body.page).toBe(2);
      expect(res.body.items.length).toBe(10);
    });

    it('DEMONSTRATE ACCEPTANCE: should reject excessive pagination limit (> 50) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderAId}/saved-locations?limit=100`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Row Ownership Enforcement (Rider A cannot list, update or delete Rider B addresses)', () => {
    let riderBLocationId: string;

    beforeAll(async () => {
      // Create private location belonging exclusively to Rider B
      const insertRes = await dataSource.query(`
        INSERT INTO "saved_locations" ("user_id", "label", "address_type", "address_line", "latitude", "longitude")
        VALUES ('${riderBId}', 'Rider B Private Villa', 'BOTH', 'Dutt Island, Siripuram, Visakhapatnam', 17.7212, 83.3155)
        RETURNING "id";
      `);
      riderBLocationId = insertRes[0].id;
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A CANNOT LIST Rider B saved locations (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderBId}/saved-locations`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A CANNOT RETRIEVE Rider B saved location (403 or 404)', async () => {
      // Direct path access
      await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderBId}/saved-locations/${riderBLocationId}`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(403);

      // Path substitution attack: Rider A passing Rider B location ID under Rider A user path
      await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderAId}/saved-locations/${riderBLocationId}`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(404);
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A CANNOT UPDATE Rider B saved location (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/identity/users/${riderBId}/saved-locations/${riderBLocationId}`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: 'Unauthorized Tampering Attempt',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Verify Rider B's address was NOT modified
      const checkRes = await dataSource.query(`
        SELECT "label" FROM "saved_locations" WHERE "id" = '${riderBLocationId}';
      `);
      expect(checkRes[0].label).toBe('Rider B Private Villa');
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A CANNOT DELETE Rider B saved location (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/v1/identity/users/${riderBId}/saved-locations/${riderBLocationId}`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');

      // Verify Rider B's address still exists
      const checkRes = await dataSource.query(`
        SELECT "id" FROM "saved_locations" WHERE "id" = '${riderBLocationId}';
      `);
      expect(checkRes.length).toBe(1);
    });

    it('SUPPORT agent CAN view Rider B saved locations under authorized support operational scope', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderBId}/saved-locations`)
        .set('x-actor-user-id', supportAdminId)
        .set('x-actor-role', PlatformRole.SUPPORT)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].id).toBe(riderBLocationId);
    });
  });

  describe('6. Update & Delete Saved Location Workflow', () => {
    let testLocationId: string;

    beforeEach(async () => {
      const insert = await dataSource.query(`
        INSERT INTO "saved_locations" ("user_id", "label", "address_type", "address_line", "latitude", "longitude")
        VALUES ('${riderAId}', 'Old Gym', 'BOTH', 'Old Gym Street, MVP', 17.7300, 83.3300)
        RETURNING "id";
      `);
      testLocationId = insert[0].id;
    });

    it('should successfully update saved location fields', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/identity/users/${riderAId}/saved-locations/${testLocationId}`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: 'Cult.Fit MVP Colony',
          addressLine: 'Sector 4, MVP Colony Main Road',
          landmark: 'Above SBI Bank',
          latitude: 17.735,
          longitude: 83.335,
        })
        .expect(200);

      expect(res.body.label).toBe('Cult.Fit MVP Colony');
      expect(res.body.addressLine).toBe('Sector 4, MVP Colony Main Road');
      expect(res.body.landmark).toBe('Above SBI Bank');
      expect(res.body.latitude).toBe(17.735);
      expect(res.body.longitude).toBe(83.335);

      // Verify audit event
      const audits = await dataSource.query(`
        SELECT * FROM "audit_events"
        WHERE "entity_id" = '${testLocationId}' AND "action" = 'SAVED_LOCATION_UPDATED';
      `);
      expect(audits.length).toBe(1);
    });

    it('should successfully delete saved location and verify it cannot be fetched again', async () => {
      const deleteRes = await request(app.getHttpServer())
        .delete(`/v1/identity/users/${riderAId}/saved-locations/${testLocationId}`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.id).toBe(testLocationId);

      // Subsequent GET must return 404 Not Found
      await request(app.getHttpServer())
        .get(`/v1/identity/users/${riderAId}/saved-locations/${testLocationId}`)
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(404);

      // Verify deletion audit event
      const audits = await dataSource.query(`
        SELECT * FROM "audit_events"
        WHERE "entity_id" = '${testLocationId}' AND "action" = 'SAVED_LOCATION_DELETED';
      `);
      expect(audits.length).toBe(1);
    });
  });

  describe('7. Commuter Scoped Convenience Endpoints (/v1/riders/...) for Mobile Flutter App', () => {
    it('GET /v1/riders/profile should return current authenticated rider profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/riders/profile')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(res.body.id).toBe(riderAId);
      expect(res.body.riderProfile).toBeDefined();
    });

    it('POST /v1/riders/saved-locations should create location for authenticated actor', async () => {
      // Ensure space in Rider A locations
      await dataSource.query(`DELETE FROM "saved_locations" WHERE "user_id" = '${riderAId}';`);

      const res = await request(app.getHttpServer())
        .post('/v1/riders/saved-locations')
        .set('x-actor-user-id', riderAId)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: 'Mobile Flutter Saved Location',
          addressType: SavedAddressType.PICKUP,
          addressLine: 'Jagadamba Junction, Visakhapatnam',
          latitude: 17.7126,
          longitude: 83.3012,
        })
        .expect(201);

      expect(res.body.label).toBe('Mobile Flutter Saved Location');
      expect(res.body.userId).toBe(riderAId);
    });
  });
});
