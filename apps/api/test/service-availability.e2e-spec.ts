import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import {
  CityOperationalStatus,
  ZoneOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  ServiceCategoryAvailabilityItem,
} from '@ecoride/contracts';

describe('Service Availability & Pricing API E2E (EV-037)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testCityVizag = {
    id: 'c0370000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2026-VZG-037',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90370000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam EV Pilot Corridor EV-037',
    code: 'zone-vizag-ev-corridor-037',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2026-VZG-037',
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
      DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
      DELETE FROM "service_cities" WHERE "id" = '${testCityVizag.id}' OR "code" = '${testCityVizag.code}';
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

    // 1. Insert service city
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

    // 2. Insert polygonal service zone
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

  describe('1. Dynamic Service Availability Query', () => {
    it('should return available categories, ETAs, operator notice, and cancellation terms', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/service-availability')
        .send({
          city: 'visakhapatnam',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
        })
        .expect(200);

      expect(res.body.isInsideGeofence).toBe(true);
      expect(res.body.city).toBe('visakhapatnam');
      expect(res.body.categories).toBeInstanceOf(Array);
      expect(res.body.categories.length).toBe(4);

      // Verify enabled categories
      const bike = res.body.categories.find(
        (c: ServiceCategoryAvailabilityItem) => c.serviceCategory === 'CITY_COMMUTE_2W',
      );
      expect(bike.isEnabled).toBe(true);
      expect(bike.isBookable).toBe(true);
      expect(bike.estimatedFarePaise).toBeGreaterThan(0);
      expect(bike.formattedFare).toMatch(/^₹/);

      // Verify disabled categories
      const auto = res.body.categories.find(
        (c: ServiceCategoryAvailabilityItem) => c.serviceCategory === 'AUTO_COMMUTE_3W',
      );
      expect(auto.isEnabled).toBe(false);
      expect(auto.isBookable).toBe(false);
      expect(auto.rejectionOrUnavailableReason).toContain('disabled');

      // Operator notice & cancellation
      expect(res.body.operatorNotice).toContain('AP State Transport Authority Permit (GO-42)');
      expect(res.body.cancellationTerms.freeCancellationMinutes).toBe(3);
      expect(res.body.cancellationTerms.driverCompensationFeePaise).toBe(1500);
      expect(res.body.cancellationTerms.formattedCancellationFee).toBe('₹15.00');
    });

    it('should immediately reflect administrative changes in category switches', async () => {
      // Disable CITY_COMMUTE_2W in the test zone
      await dataSource.query(
        `UPDATE "zones" SET "category_switches" = jsonb_set("category_switches", '{CITY_COMMUTE_2W}', 'false') WHERE "id" = $1`,
        [testZoneBeachRoad.id],
      );

      const res = await request(app.getHttpServer())
        .post('/v1/quotes/service-availability')
        .send({
          city: 'visakhapatnam',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
        })
        .expect(200);

      const bike = res.body.categories.find(
        (c: ServiceCategoryAvailabilityItem) => c.serviceCategory === 'CITY_COMMUTE_2W',
      );
      expect(bike.isEnabled).toBe(false);
      expect(bike.isBookable).toBe(false);

      // Restore switch
      await dataSource.query(
        `UPDATE "zones" SET "category_switches" = jsonb_set("category_switches", '{CITY_COMMUTE_2W}', 'true') WHERE "id" = $1`,
        [testZoneBeachRoad.id],
      );
    });

    it('should return empty categories for coordinates outside authorized service zones', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/service-availability')
        .send({
          city: 'visakhapatnam',
          pickupLatitude: 17.5, // outside testZoneBeachRoad boundary
          pickupLongitude: 83.1,
        })
        .expect(200);

      expect(res.body.isInsideGeofence).toBe(false);
      expect(res.body.categories).toEqual([]);
    });
  });
});
