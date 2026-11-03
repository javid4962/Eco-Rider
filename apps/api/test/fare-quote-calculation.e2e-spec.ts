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
  VehicleServiceClass,
  ApiErrorCode,
} from '@ecoride/contracts';

describe('Fare Quote Calculation & Rounding E2E (EV-035)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testRiderUser = {
    id: 'b0350000-0000-4000-8000-000000000001',
    phone: '+919988776611',
    role: PlatformRole.RIDER,
    name: 'Vizag Commuter EV-035',
  };

  const testCityVizag = {
    id: 'c0350000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2026-VZG-035',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90350000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam EV Pilot Corridor EV-035',
    code: 'zone-vizag-ev-corridor-035',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2026-VZG-035',
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
      DELETE FROM "ride_quotes" WHERE "city" = 'visakhapatnam' AND "rider_id" = '${testRiderUser.id}';
      DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
      DELETE FROM "service_cities" WHERE "id" = '${testCityVizag.id}' OR "code" = '${testCityVizag.code}';
      DELETE FROM "users" WHERE "id" = '${testRiderUser.id}';
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
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    dataSource = app.get(DataSource);

    if (dataSource.isInitialized) {
      await cleanupTestData();

      // Seed Rider
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES ('${testRiderUser.id}', '${testRiderUser.phone}', '${testRiderUser.role}', '${testRiderUser.name}', true)
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
        ) ON CONFLICT ("code") DO UPDATE SET
          "category_switches" = EXCLUDED.category_switches,
          "boundary" = EXCLUDED.boundary,
          "operational_status" = 'ACTIVE';
      `);
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await cleanupTestData();
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. Authoritative Fare Calculation & Whole-Rupee Rounding', () => {
    it('should calculate 2W electric bike quote with integer paise, rounding delta, and 5% AP GST', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_BIKE',
          passengerCount: 1,
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.city).toBe('visakhapatnam');
      expect(res.body.serviceCategory).toBe('CITY_COMMUTE_2W');
      expect(res.body.vehicleClass).toBe(VehicleServiceClass.ECO_BIKE);
      expect(res.body.passengerCount).toBe(1);
      expect(res.body.propulsion).toBe('BATTERY_ELECTRIC');

      const breakdown = res.body.fareBreakdown;
      expect(breakdown).toBeDefined();
      expect(breakdown.baseFarePaise).toBe(2500); // Vizag 2W pilot base fare
      expect(breakdown.platformFeePaise).toBe(200); // ₹2.00 platform fee
      expect(breakdown.taxes).toBeDefined();
      expect(breakdown.taxes.cgstPaise).toBeGreaterThan(0);
      expect(breakdown.taxes.sgstPaise).toBeGreaterThan(0);
      expect(breakdown.unroundedTotalPaise).toBeGreaterThan(2500);

      // Whole-rupee rounding verification
      expect(breakdown.totalPaise % 100).toBe(0);
      expect(breakdown.totalPaise).toBe(res.body.fare.amountPaise);
      expect(breakdown.roundingDeltaPaise).toBe(
        breakdown.totalPaise - breakdown.unroundedTotalPaise,
      );
      expect(res.body.fare.formattedRupees).toMatch(/^₹\d+\.00$/);
    });

    it('should calculate shared shuttle quote scaled per seat for 3 passengers', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'SHARED_SHUTTLE_4W',
          vehicleClass: 'ECO_VAN',
          passengerCount: 3,
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.serviceCategory).toBe('SHARED_SHUTTLE_4W');
      expect(res.body.vehicleClass).toBe(VehicleServiceClass.ECO_VAN);
      expect(res.body.passengerCount).toBe(3);

      const bd = res.body.fareBreakdown;
      expect(bd.perPassengerFarePaise).toBeDefined();
      expect(bd.subtotalPaise).toBe(bd.perPassengerFarePaise * 3);
      expect(bd.totalPaise % 100).toBe(0); // Nearest rupee
    });
  });

  describe('2. Client-Supplied Fare Override Tamper-Resistance', () => {
    it('should ignore client-supplied fare and strictly enforce server calculation', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
          clientSuppliedFare: 100, // Attacker attempts ₹1.00
        })
        .expect(200);

      expect(res.body.fare.amountPaise).toBeGreaterThan(2500);
      expect(res.body.fare.amountPaise).not.toBe(100);
    });
  });

  describe('3. Vehicle Class & Capacity Security Controls', () => {
    it('should reject passenger count > 1 for 2W electric bike taxi', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          passengerCount: 2, // Over-capacity for 2W
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(res.body.error.message).toContain('exceeds legal passenger capacity of 1');
    });

    it('should reject incompatible vehicle class and service category', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_CAB', // Mismatched class
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(res.body.error.message).toContain('incompatible');
    });
  });

  describe('4. Provider Fallback Routing Simulation', () => {
    it('should fall back gracefully to geometric estimation when downtime is simulated', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
          simulateProviderDowntime: true,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.fareBreakdown.isRouteFallback).toBe(true);
      expect(res.body.fare.amountPaise).toBeGreaterThan(2500);
    });
  });

  describe('5. Quote Retrieval & Immutability Audit', () => {
    it('should retrieve persisted quote retaining exact rounding delta and breakdown', async () => {
      // 1. Create quote
      const createRes = await request(app.getHttpServer())
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

      const quoteId = createRes.body.quoteId;

      // 2. Retrieve quote
      const getRes = await request(app.getHttpServer()).get(`/v1/quotes/${quoteId}`).expect(200);

      expect(getRes.body.id).toBe(quoteId);
      expect(getRes.body.totalFarePaise).toBe(createRes.body.fare.amountPaise);
      expect(getRes.body.fareBreakdown.roundingDeltaPaise).toBe(
        createRes.body.fareBreakdown.roundingDeltaPaise,
      );
      expect(getRes.body.fareBreakdown.unroundedTotalPaise).toBe(
        createRes.body.fareBreakdown.unroundedTotalPaise,
      );
      expect(getRes.body.vehicleClass).toBe(VehicleServiceClass.ECO_BIKE);
    });
  });
});
