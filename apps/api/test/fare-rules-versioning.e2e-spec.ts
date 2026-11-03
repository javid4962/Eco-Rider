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
} from '@ecoride/contracts';

describe('Versioned Server-Side Fare Rules & Quote Retention E2E (EV-034)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testAdminUser = {
    id: 'a0340000-0000-4000-8000-000000000001',
    phone: '+919876543210',
    role: PlatformRole.OPERATOR,
    name: 'Tariff Administrator (AP Transport Dept)',
  };

  const testRiderUser = {
    id: 'b0340000-0000-4000-8000-000000000001',
    phone: '+919988776655',
    role: PlatformRole.RIDER,
    name: 'Vizag Commuter',
  };

  const testCityVizag = {
    id: 'c0340000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2026-VZG-034',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90340000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam EV Pilot Corridor',
    code: 'zone-vizag-ev-corridor-034',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2026-VZG-034',
    permitExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    centerLatitude: 17.72,
    centerLongitude: 83.31,
    categorySwitches: {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      CITY_COMMUTE_2W: true,
      CAB_PRIVATE_4W: true,
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
      DELETE FROM "ride_quotes" WHERE "fare_rule_id" IN (SELECT "id" FROM "fare_rules" WHERE "rule_code" LIKE 'E2E-TEST-%');
      DELETE FROM "fare_rules" WHERE "rule_code" LIKE 'E2E-TEST-%';
      DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
      DELETE FROM "service_cities" WHERE "id" = '${testCityVizag.id}' OR "code" = '${testCityVizag.code}';
      DELETE FROM "users" WHERE "id" IN ('${testAdminUser.id}', '${testRiderUser.id}');
      UPDATE "fare_rules" SET "status" = 'ACTIVE', "effective_to" = NULL WHERE "id" = 'f0000000-0000-0000-0000-000000000002';
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
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    dataSource = app.get(DataSource);

    if (dataSource.isInitialized) {
      await cleanupTestData();

      // Seed Users
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES 
          ('${testAdminUser.id}', '${testAdminUser.phone}', '${testAdminUser.role}', '${testAdminUser.name}', true),
          ('${testRiderUser.id}', '${testRiderUser.phone}', '${testRiderUser.role}', '${testRiderUser.name}', true)
        ON CONFLICT ("id") DO NOTHING;
      `);

      // Seed City
      await dataSource.query(`
        INSERT INTO "service_cities" (
          "id", "code", "name", "state", "operational_status", "evidence_reference",
          "center_latitude", "center_longitude", "category_switches"
        ) VALUES (
          '${testCityVizag.id}', '${testCityVizag.code}', '${testCityVizag.name}', '${testCityVizag.state}',
          '${testCityVizag.operationalStatus}', '${testCityVizag.evidenceReference}',
          ${testCityVizag.centerLatitude}, ${testCityVizag.centerLongitude},
          '${JSON.stringify(testZoneBeachRoad.categorySwitches)}'
        ) ON CONFLICT ("code") DO NOTHING;
      `);

      // Seed Zone
      const boundaryGeoJson = JSON.stringify(testZoneBeachRoad.boundary);
      await dataSource.query(`
        INSERT INTO "zones" (
          "id", "code", "name", "city", "operational_status", "evidence_reference",
          "permit_expires_at", "center_latitude", "center_longitude", "category_switches",
          "boundary", "is_active"
        ) VALUES (
          '${testZoneBeachRoad.id}', '${testZoneBeachRoad.code}', '${testZoneBeachRoad.name}', '${testZoneBeachRoad.city}',
          '${testZoneBeachRoad.operationalStatus}', '${testZoneBeachRoad.evidenceReference}',
          '${testZoneBeachRoad.permitExpiresAt}', ${testZoneBeachRoad.centerLatitude}, ${testZoneBeachRoad.centerLongitude},
          '${JSON.stringify(testZoneBeachRoad.categorySwitches)}',
          ST_SetSRID(ST_GeomFromGeoJSON('${boundaryGeoJson}'), 4326),
          true
        ) ON CONFLICT ("code") DO NOTHING;
      `);
    }
  }, 35000);

  afterAll(async () => {
    await cleanupTestData();
    if (app) {
      await app.close();
    }
  }, 35000);

  let ruleV1Id: string;
  let ruleV2Id: string;
  let quoteQ1Id: string;
  let quoteQ1TotalPaise: number;
  let quoteQ2Id: string;

  describe('1. Draft Creation & Non-Live Illustrative Fares', () => {
    it('should create initial fare rule version 1 in DRAFT status', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/fare-rules')
        .set('x-actor-user-id', testAdminUser.id)
        .set('x-actor-role', testAdminUser.role)
        .send({
          ruleCode: 'E2E-TEST-2W-V1',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500, // ₹25
          baseDistanceMeters: 1000, // 1 km
          perKmRatePaise: 800, // ₹8/km
          perMinuteRatePaise: 100, // ₹1/min
          waitingChargePaisePerMinute: 100,
          minimumFarePaise: 2500,
          taxRateBps: 500, // 5% GST
          commissionRateBps: 1500,
          effectiveFrom: '2026-01-01T00:00:00Z',
          notes: 'AP EV Pilot Baseline Tariff',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.version).toBeGreaterThanOrEqual(1);
      expect(res.body.status).toBe('DRAFT');
      expect(res.body.baseFarePaise).toBe(2500);
      ruleV1Id = res.body.id;
    });

    it('should reject approval attempt by unauthorized RIDER role with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/v1/fare-rules/${ruleV1Id}/approve`)
        .set('x-actor-user-id', testRiderUser.id)
        .set('x-actor-role', testRiderUser.role)
        .send({
          evidenceReference: 'AP-STA-2026-GO-42',
        })
        .expect(403);
    });

    it('should reject approval without statutory evidence reference with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post(`/v1/fare-rules/${ruleV1Id}/approve`)
        .set('x-actor-user-id', testAdminUser.id)
        .set('x-actor-role', testAdminUser.role)
        .send({
          evidenceReference: '',
        })
        .expect(400);
    });

    it('should approve rule v1 with statutory reference and transition status to ACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/fare-rules/${ruleV1Id}/approve`)
        .set('x-actor-user-id', testAdminUser.id)
        .set('x-actor-role', testAdminUser.role)
        .send({
          evidenceReference: 'AP-STA-2026-GO-42-PILOT-CORRIDOR',
          notes: 'Formally gazetted tariff approved by AP Transport Dept',
        })
        .expect(200);

      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.evidenceReference).toBe('AP-STA-2026-GO-42-PILOT-CORRIDOR');
      expect(res.body.approvedById).toBe(testAdminUser.id);
      expect(res.body.approvedAt).toBeDefined();
    });

    it('should record audit trail for draft creation and approval', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/fare-rules/${ruleV1Id}/audit`)
        .set('x-actor-user-id', testAdminUser.id)
        .set('x-actor-role', testAdminUser.role)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const actions = res.body.map((a: { action: string }) => a.action);
      expect(actions).toContain('FARE_RULE_APPROVED');
    });
  });

  describe('2. Quote Generation under Version 1 and Persistence', () => {
    it('should generate Quote Q1 under Version 1 with immutable snapshot', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.fareRuleId).toBe(ruleV1Id);
      expect(res.body.fareRuleVersion).toBeDefined();
      expect(res.body.fareBreakdown).toBeDefined();
      expect(res.body.fareBreakdown.baseFarePaise).toBe(2500);

      quoteQ1Id = res.body.quoteId;
      quoteQ1TotalPaise = res.body.fare.amountPaise;
      expect(quoteQ1TotalPaise).toBeGreaterThan(2500);
    });
  });

  describe('3. Version 2 Upgrade & Superseding Previous Rule', () => {
    it('should draft and approve Fare Rule Version 2 with revised base fare ₹35', async () => {
      // 1. Create Draft V2
      const draftRes = await request(app.getHttpServer())
        .post('/v1/fare-rules')
        .set('x-actor-user-id', testAdminUser.id)
        .set('x-actor-role', testAdminUser.role)
        .send({
          ruleCode: 'E2E-TEST-2W-V2',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 3500, // Revised base fare ₹35
          baseDistanceMeters: 1000,
          perKmRatePaise: 1000, // Revised rate ₹10/km
          perMinuteRatePaise: 150,
          minimumFarePaise: 3500,
          taxRateBps: 500,
          effectiveFrom: '2026-06-01T00:00:00Z',
          notes: 'Statutory revised fare indexation',
        })
        .expect(201);

      ruleV2Id = draftRes.body.id;
      expect(draftRes.body.version).toBeGreaterThan(1);
      expect(draftRes.body.status).toBe('DRAFT');

      // 2. Approve V2
      const approveRes = await request(app.getHttpServer())
        .post(`/v1/fare-rules/${ruleV2Id}/approve`)
        .set('x-actor-user-id', testAdminUser.id)
        .set('x-actor-role', testAdminUser.role)
        .send({
          evidenceReference: 'AP-STA-2026-GO-89-REVISED-TARIFF',
        })
        .expect(200);

      expect(approveRes.body.status).toBe('ACTIVE');

      // 3. Verify Rule V1 was transitioned to SUPERSEDED
      const v1Check = await request(app.getHttpServer())
        .get(`/v1/fare-rules/${ruleV1Id}`)
        .expect(200);

      expect(v1Check.body.status).toBe('SUPERSEDED');
      expect(v1Check.body.effectiveTo).toBeDefined();
    });

    it('should generate Quote Q2 under Version 2 with higher revised base fare', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.fareRuleId).toBe(ruleV2Id);
      expect(res.body.fareBreakdown.baseFarePaise).toBe(3500); // Uses new base fare ₹35
      expect(res.body.fare.amountPaise).toBeGreaterThan(quoteQ1TotalPaise);

      quoteQ2Id = res.body.quoteId;
    });
  });

  describe('4. ACCEPTANCE CRITERIA DEMONSTRATION: Old Quotes Retain Original Price Version', () => {
    it('should confirm old ride Quote Q1 retains its original price version and rate breakdown without retroactive recalculation', async () => {
      const res = await request(app.getHttpServer()).get(`/v1/quotes/${quoteQ1Id}`).expect(200);

      // Quote Q1 MUST retain original Version 1 rate and fare
      expect(res.body.id).toBe(quoteQ1Id);
      expect(res.body.fareRuleId).toBe(ruleV1Id);
      expect(res.body.fareBreakdown.baseFarePaise).toBe(2500); // Still ₹25, NOT ₹35!
      expect(res.body.totalFarePaise).toBe(quoteQ1TotalPaise); // Price unchanged!
    });

    it('should confirm Quote Q2 reflects Version 2 pricing while Q1 remains unmutated', async () => {
      const q2Res = await request(app.getHttpServer()).get(`/v1/quotes/${quoteQ2Id}`).expect(200);

      expect(q2Res.body.id).toBe(quoteQ2Id);
      expect(q2Res.body.fareRuleId).toBe(ruleV2Id);
      expect(q2Res.body.fareBreakdown.baseFarePaise).toBe(3500); // ₹35

      // Re-verify Q1 again to prove complete immutability across subsequent queries
      const q1Res = await request(app.getHttpServer()).get(`/v1/quotes/${quoteQ1Id}`).expect(200);

      expect(q1Res.body.totalFarePaise).toBe(quoteQ1TotalPaise);
      expect(q1Res.body.fareBreakdown.baseFarePaise).toBe(2500);
    });

    it('should return 404 Not Found for non-existent quote UUID', async () => {
      await request(app.getHttpServer())
        .get('/v1/quotes/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
