import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import {
  PlatformRole,
  CityOperationalStatus,
  ZoneOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  ApiErrorCode,
} from '@ecoride/contracts';

describe('Quote Safeguards, Expiry, Eligibility & Replay E2E (EV-036)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testRiderAlice = {
    id: 'b0360000-0000-4000-8000-000000000001',
    phone: '+919988776631',
    role: PlatformRole.RIDER,
    name: 'Rider Alice EV-036',
  };

  const testRiderBob = {
    id: 'b0360000-0000-4000-8000-000000000002',
    phone: '+919988776632',
    role: PlatformRole.RIDER,
    name: 'Rider Bob EV-036',
  };

  const testCityVizag = {
    id: 'c0360000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2026-VZG-036',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90360000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam EV Pilot Corridor EV-036',
    code: 'zone-vizag-ev-corridor-036',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2026-VZG-036',
    permitExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    centerLatitude: 17.72,
    centerLongitude: 83.31,
    categorySwitches: {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      CITY_COMMUTE_2W: true,
      SHARED_SHUTTLE_4W: true,
    },
    boundary: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [83.25, 17.65],
          [83.4, 17.65],
          [83.4, 17.8],
          [83.25, 17.8],
          [83.25, 17.65],
        ],
      ],
    },
  };

  async function cleanupTestData() {
    if (!dataSource || !dataSource.isInitialized) return;

    await dataSource.query(`
      DELETE FROM "bookings" WHERE "idempotency_key" LIKE 'idemp-ev036-%' OR "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}');
      DELETE FROM "ride_quotes" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}');
      DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
      DELETE FROM "service_cities" WHERE "id" = '${testCityVizag.id}' OR "code" = '${testCityVizag.code}';
      DELETE FROM "users" WHERE "id" IN ('${testRiderAlice.id}', '${testRiderBob.id}');
      UPDATE "fare_rules" SET "status" = 'ACTIVE', "effective_to" = NULL WHERE "id" IN (
        'f0000000-0000-0000-0000-000000000002',
        'f0000000-0000-0000-0000-000000000003'
      );
    `);
  }

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
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    await cleanupTestData();

    // 1. Insert test rider users
    await dataSource.query(
      `INSERT INTO "users" ("id", "phone", "role", "name", "is_active", "created_at", "updated_at")
       VALUES
         ($1, $2, $3, $4, true, NOW(), NOW()),
         ($5, $6, $7, $8, true, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      [
        testRiderAlice.id,
        testRiderAlice.phone,
        testRiderAlice.role,
        testRiderAlice.name,
        testRiderBob.id,
        testRiderBob.phone,
        testRiderBob.role,
        testRiderBob.name,
      ],
    );

    // 2. Insert service city
    await dataSource.query(
      `INSERT INTO "service_cities" ("id", "code", "name", "state", "operational_status", "evidence_reference", "center_latitude", "center_longitude")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("code") DO UPDATE SET "operational_status" = $5`,
      [
        testCityVizag.id,
        testCityVizag.code,
        testCityVizag.name,
        testCityVizag.state,
        testCityVizag.operationalStatus,
        testCityVizag.evidenceReference,
        testCityVizag.centerLatitude,
        testCityVizag.centerLongitude,
      ],
    );

    // 3. Insert polygonal service zone
    const boundaryGeoJson = JSON.stringify(testZoneBeachRoad.boundary);
    await dataSource.query(
      `INSERT INTO "zones" (
         "id", "name", "code", "city", "operational_status", "evidence_reference",
         "permit_expires_at", "center_latitude", "center_longitude", "boundary",
         "category_switches"
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         ST_SetSRID(ST_GeomFromGeoJSON('${boundaryGeoJson}'), 4326),
         $10
       )
       ON CONFLICT ("code") DO UPDATE SET
         "operational_status" = $5,
         "category_switches" = $10`,
      [
        testZoneBeachRoad.id,
        testZoneBeachRoad.name,
        testZoneBeachRoad.code,
        testZoneBeachRoad.city,
        testZoneBeachRoad.operationalStatus,
        testZoneBeachRoad.evidenceReference,
        testZoneBeachRoad.permitExpiresAt,
        testZoneBeachRoad.centerLatitude,
        testZoneBeachRoad.centerLongitude,
        JSON.stringify(testZoneBeachRoad.categorySwitches),
      ],
    );
  });

  afterAll(async () => {
    await cleanupTestData();
    if (app) {
      await app.close();
    }
  });

  describe('1. Authoritative Quote $\\rightarrow$ Eligibility $\\rightarrow$ Booking Creation Flow', () => {
    let createdQuoteId: string;
    let createdQuoteToken: string;
    let totalFarePaise: number;

    it('should generate an authoritative quote with cryptographic token and pinned parameters', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_BIKE',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          passengerCount: 1,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.quoteToken).toBeDefined();
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.riderId).toBe(testRiderAlice.id);
      expect(res.body.fareRuleVersion).toBe(1);
      expect(res.body.fare.amountPaise).toBeGreaterThan(0);
      expect(res.body.propulsion).toBe('BATTERY_ELECTRIC');

      createdQuoteId = res.body.quoteId;
      createdQuoteToken = res.body.quoteToken;
      totalFarePaise = res.body.fare.amountPaise;
    });

    it('should verify quote eligibility successfully before booking', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/quotes/${createdQuoteId}/verify-eligibility`)
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteToken: createdQuoteToken,
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          serviceCategory: 'CITY_COMMUTE_2W',
          passengerCount: 1,
        })
        .expect(200);

      expect(res.body.isEligible).toBe(true);
      expect(res.body.quoteId).toBe(createdQuoteId);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.isExpired).toBe(false);
      expect(res.body.isConsumed).toBe(false);
    });

    it('should successfully book using the active quote and pin fare version, OTP, and coordinates', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: createdQuoteId,
          quoteToken: createdQuoteToken,
          idempotencyKey: 'idemp-ev036-alice-001',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          serviceCategory: 'CITY_COMMUTE_2W',
          passengerCount: 1,
        })
        .expect(201);

      expect(res.body.bookingId).toBeDefined();
      expect(res.body.bookingCode).toMatch(/^ECO-VZ-/);
      expect(res.body.riderId).toBe(testRiderAlice.id);
      expect(res.body.quoteId).toBe(createdQuoteId);
      expect(res.body.fareRuleVersion).toBe(1);
      expect(res.body.status).toBe('CREATED');
      expect(res.body.fareAmountPaise).toBe(totalFarePaise);
      expect(res.body.startOtp).toMatch(/^\d{4}$/);
      expect(res.body.idempotencyKey).toBe('idemp-ev036-alice-001');

      // Verify DB record transitions to CONSUMED
      const quoteRow = await dataSource.query(
        `SELECT status, booking_id, idempotency_key, consumed_at FROM "ride_quotes" WHERE id = $1`,
        [createdQuoteId],
      );
      expect(quoteRow[0].status).toBe('CONSUMED');
      expect(quoteRow[0].booking_id).toBe(res.body.bookingId);
      expect(quoteRow[0].idempotency_key).toBe('idemp-ev036-alice-001');
      expect(quoteRow[0].consumed_at).not.toBeNull();
    });

    it('should idempotently return existing booking on replay with SAME idempotency key', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: createdQuoteId,
          quoteToken: createdQuoteToken,
          idempotencyKey: 'idemp-ev036-alice-001',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          serviceCategory: 'CITY_COMMUTE_2W',
          passengerCount: 1,
        });

      // Idempotent success
      expect([200, 201]).toContain(res.status);
      expect(res.body.quoteId).toBe(createdQuoteId);
      expect(res.body.idempotencyKey).toBe('idemp-ev036-alice-001');
    });

    it('should reject replay with DIFFERENT idempotency key on consumed quote with HTTP 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: createdQuoteId,
          quoteToken: createdQuoteToken,
          idempotencyKey: 'idemp-ev036-alice-002-conflicting',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          serviceCategory: 'CITY_COMMUTE_2W',
          passengerCount: 1,
        })
        .expect(409);

      expect(res.body.error.code).toBe(ApiErrorCode.CONFLICT);
      expect(res.body.error.message).toContain('already been consumed');
    });
  });

  describe('2. Cross-Account Quote Access Safeguards', () => {
    let aliceQuoteId: string;
    let aliceQuoteToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_BIKE',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          passengerCount: 1,
        })
        .expect(200);

      aliceQuoteId = res.body.quoteId;
      aliceQuoteToken = res.body.quoteToken;
    });

    it('should reject Bob attempting to verify Alice’s quote with HTTP 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/quotes/${aliceQuoteId}/verify-eligibility`)
        .set('x-actor-user-id', testRiderBob.id)
        .send({
          quoteToken: aliceQuoteToken,
        })
        .expect(403);

      expect(res.body.error.code).toBe(ApiErrorCode.FORBIDDEN);
      expect(res.body.error.message).toContain('Access denied');
    });

    it('should reject Bob attempting to book Alice’s quote with HTTP 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderBob.id)
        .send({
          quoteId: aliceQuoteId,
          quoteToken: aliceQuoteToken,
          idempotencyKey: 'idemp-ev036-bob-theft-attempt',
        })
        .expect(403);

      expect(res.body.error.code).toBe(ApiErrorCode.FORBIDDEN);
      expect(res.body.error.message).toContain('Access denied');
    });
  });

  describe('3. Tampering & Cryptographic Token Safeguards', () => {
    let validQuoteId: string;
    let validQuoteToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_BIKE',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          passengerCount: 1,
        })
        .expect(200);

      validQuoteId = res.body.quoteId;
      validQuoteToken = res.body.quoteToken;
    });

    it('should reject booking with a tampered token signature (HTTP 400 Bad Request)', async () => {
      const [payloadB64, signature] = validQuoteToken.split('.');
      const tamperedSig = signature.substring(0, signature.length - 4) + 'ZZZZ';
      const tamperedToken = `${payloadB64}.${tamperedSig}`;

      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: validQuoteId,
          quoteToken: tamperedToken,
          idempotencyKey: 'idemp-ev036-tamper-sig',
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(res.body.error.message).toContain('tampered');
    });

    it('should reject booking when client modifies passenger count to exceed pinned quote (HTTP 400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: validQuoteId,
          quoteToken: validQuoteToken,
          idempotencyKey: 'idemp-ev036-mismatch-passenger',
          passengerCount: 4, // pinned quote was 1 passenger
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(res.body.error.message).toContain('does not match pinned quote');
    });

    it('should reject booking when client modifies service category (HTTP 400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: validQuoteId,
          quoteToken: validQuoteToken,
          idempotencyKey: 'idemp-ev036-mismatch-category',
          serviceCategory: 'SHARED_SHUTTLE_4W', // pinned quote was 2W
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(res.body.error.message).toContain('does not match pinned quote');
    });
  });

  describe('4. Quote Expiry Safeguards', () => {
    let fastExpiringQuoteId: string;
    let fastExpiringToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_BIKE',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          passengerCount: 1,
          expiresInSeconds: 1, // 1 second validity
        })
        .expect(200);

      fastExpiringQuoteId = res.body.quoteId;
      fastExpiringToken = res.body.quoteToken;

      // Wait 1.5 seconds for expiry
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });

    it('should reject expired quote at verification endpoint and update status to EXPIRED (HTTP 400)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/quotes/${fastExpiringQuoteId}/verify-eligibility`)
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteToken: fastExpiringToken,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(res.body.error.message).toContain('expired');

      const quoteRow = await dataSource.query(`SELECT status FROM "ride_quotes" WHERE id = $1`, [
        fastExpiringQuoteId,
      ]);
      expect(quoteRow[0].status).toBe('EXPIRED');
    });

    it('should reject booking transition on expired quote with HTTP 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: fastExpiringQuoteId,
          quoteToken: fastExpiringToken,
          idempotencyKey: 'idemp-ev036-booking-expired',
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(res.body.error.message).toContain('expired');
    });
  });

  describe('5. Post-Quote Zone Revocation Safeguards', () => {
    let quoteInZoneId: string;
    let quoteInZoneToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_BIKE',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          passengerCount: 1,
        })
        .expect(200);

      quoteInZoneId = res.body.quoteId;
      quoteInZoneToken = res.body.quoteToken;

      // Now administratively disable CITY_COMMUTE_2W switch in test zone
      await dataSource.query(
        `UPDATE "zones" SET "category_switches" = jsonb_set("category_switches", '{CITY_COMMUTE_2W}', 'false') WHERE "id" = $1`,
        [testZoneBeachRoad.id],
      );
    });

    afterAll(async () => {
      // Restore switch
      await dataSource.query(
        `UPDATE "zones" SET "category_switches" = jsonb_set("category_switches", '{CITY_COMMUTE_2W}', 'true') WHERE "id" = $1`,
        [testZoneBeachRoad.id],
      );
    });

    it('should reject eligibility verification and mark quote REVOKED when category switch is disabled (HTTP 400 ZONE_RESTRICTED)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/quotes/${quoteInZoneId}/verify-eligibility`)
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteToken: quoteInZoneToken,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.ZONE_RESTRICTED);

      const quoteRow = await dataSource.query(`SELECT status FROM "ride_quotes" WHERE id = $1`, [
        quoteInZoneId,
      ]);
      expect(quoteRow[0].status).toBe('REVOKED');
    });

    it('should block booking transition with HTTP 400 ZONE_RESTRICTED when zone permission is revoked', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/bookings')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId: quoteInZoneId,
          quoteToken: quoteInZoneToken,
          idempotencyKey: 'idemp-ev036-booking-revoked-zone',
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.ZONE_RESTRICTED);
    });
  });
});
