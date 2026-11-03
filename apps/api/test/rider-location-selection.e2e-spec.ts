import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import {
  PlatformRole,
  ApiErrorCode,
  CityOperationalStatus,
  ZoneOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  AddressSuggestion,
  SavedLocationDto,
} from '@ecoride/contracts';

describe('Rider Location Selection & Pilot Zone Verification E2E (EV-033)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testRiderUser = {
    id: 'a0330000-0000-4000-8000-000000000001',
    phone: '+919988776655',
    role: PlatformRole.RIDER,
    name: 'Srinivas Rao (Vizag Commuter)',
  };

  const testCityVizag = {
    id: 'c0330000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2025-VZG-033',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90330000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam Urban EV Test Zone',
    code: 'zone-vizag-urban-ev-033',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2025-VZG-033',
    permitExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    centerLatitude: 17.72,
    centerLongitude: 83.31,
    categorySwitches: {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      CITY_COMMUTE_2W: true,
      CAB_PRIVATE_4W: false,
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
      DELETE FROM "saved_locations" WHERE "user_id" = '${testRiderUser.id}';
      DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
      DELETE FROM "service_cities" WHERE "id" = '${testCityVizag.id}' OR "code" = '${testCityVizag.code}';
      DELETE FROM "users" WHERE "id" = '${testRiderUser.id}' OR "phone" = '${testRiderUser.phone}';
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

      // Seed rider user
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES ('${testRiderUser.id}', '${testRiderUser.phone}', '${testRiderUser.role}', '${testRiderUser.name}', true)
        ON CONFLICT ("id") DO NOTHING;
      `);

      // Seed test city
      await dataSource.query(`
        INSERT INTO "service_cities" (
          "id", "code", "name", "state", "operational_status", "evidence_reference",
          "center_latitude", "center_longitude", "category_switches"
        ) VALUES (
          '${testCityVizag.id}', '${testCityVizag.code}', '${testCityVizag.name}', '${testCityVizag.state}',
          '${testCityVizag.operationalStatus}', '${testCityVizag.evidenceReference}',
          ${testCityVizag.centerLatitude}, ${testCityVizag.centerLongitude},
          '${JSON.stringify({ ...DEFAULT_DISABLED_CATEGORY_SWITCHES, CITY_COMMUTE_2W: true })}'
        ) ON CONFLICT ("code") DO NOTHING;
      `);

      // Seed test zone
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

  describe('1. Searchable Location Suggestions (GET /v1/maps/suggestions)', () => {
    it('should return autocompletion suggestions matching query in Visakhapatnam', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/maps/suggestions')
        .query({ query: 'Beach', city: 'Visakhapatnam', limit: 5 })
        .expect(200);

      expect(res.body.suggestions).toBeDefined();
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body.suggestions.length).toBeGreaterThan(0);

      const rkBeach = res.body.suggestions.find((s: AddressSuggestion) =>
        s.primaryText.toLowerCase().includes('beach'),
      );
      expect(rkBeach).toBeDefined();
      expect(rkBeach.city.toLowerCase()).toBe('visakhapatnam');
      expect(rkBeach.coordinates.latitude).toBeCloseTo(17.7126, 1);
      expect(rkBeach.coordinates.longitude).toBeCloseTo(83.32, 1);
    });

    it('should return suggestions for single-character search query', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/maps/suggestions')
        .query({ query: 'R', city: 'Visakhapatnam' })
        .expect(200);

      expect(res.body.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('2. Reverse Geocoding for Manual Pin Selection (POST /v1/maps/reverse-geocode)', () => {
    it('should resolve manual pin coordinates to human-readable Andhra Pradesh address', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/maps/reverse-geocode')
        .send({ latitude: 17.7126, longitude: 83.3174 })
        .expect(200);

      expect(res.body.fullAddress).toBeDefined();
      expect(res.body.fullAddress).toContain('Visakhapatnam');
      expect(res.body.isWithinAndhraPradesh).toBe(true);
      expect(res.body.state).toBe('Andhra Pradesh');
    });
  });

  describe('3. Point-in-Polygon Geofence Verification (POST /v1/zones/verify-location)', () => {
    it('should authorize manually selected coordinates within Visakhapatnam test zone', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.72,
          longitude: 83.31,
          serviceCategory: 'CITY_COMMUTE_2W',
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(true);
      expect(res.body.isInsideGeofence).toBe(true);
      expect(res.body.isCategoryEnabled).toBe(true);
      expect(res.body.zoneCode).toBe(testZoneBeachRoad.code);
    });

    it('should reject coordinates outside active pilot geofence and explain reason', async () => {
      // Coordinates in Vijayawada (outside Visakhapatnam test geofence)
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 16.5062,
          longitude: 80.648,
          serviceCategory: 'CITY_COMMUTE_2W',
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(false);
      expect(res.body.isInsideGeofence).toBe(false);
      expect(res.body.rejectionReason).toBeDefined();
      expect(res.body.rejectionReason).toContain('outside authorized');
    });

    it('should resist client forged availability and enforce database state', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 16.5062,
          longitude: 80.648,
          serviceCategory: 'CITY_COMMUTE_2W',
          clientForgedAvailability: true,
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(false);
    });
  });

  describe('4. Authoritative Quote Calculation (POST /v1/quotes/authoritative)', () => {
    it('should calculate valid EV fare quote for manually selected locations in test zone', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7412,
          dropoffLongitude: 83.3325,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.propulsion).toBe('BATTERY_ELECTRIC');
      expect(res.body.distanceMeters).toBeGreaterThan(1000);
      expect(res.body.fare.amountPaise).toBeGreaterThan(2500);
      expect(res.body.fare.currency).toBe('INR');
      expect(res.body.fare.formattedRupees).toMatch(/^₹\d+\.\d{2}$/);
      expect(res.body.expiresAt).toBeDefined();
    });

    it('should reject quote calculation when pickup is outside pilot zone and explain why', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 16.4975, // Benz Circle, Vijayawada (outside Vizag zone)
          pickupLongitude: 80.6558,
          dropoffLatitude: 17.7126,
          dropoffLongitude: 83.3174,
        })
        .expect(400);

      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe(ApiErrorCode.ZONE_RESTRICTED);
      expect(res.body.error.message).toContain('outside authorized');
    });
  });

  describe('5. Saved Locations API (GET & POST /v1/riders/saved-locations)', () => {
    it('should save a new favorite place and retrieve it for the authenticated rider', async () => {
      // 1. Create a saved place
      const createRes = await request(app.getHttpServer())
        .post('/v1/riders/saved-locations')
        .set('x-actor-user-id', testRiderUser.id)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          label: 'Home (Beach Road)',
          addressType: 'BOTH',
          addressLine: 'Plot 42, Ramakrishna Beach Road',
          landmark: 'Tenneti Park Junction',
          latitude: 17.7126,
          longitude: 83.3174,
        })
        .expect(201);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.label).toBe('Home (Beach Road)');
      expect(createRes.body.latitude).toBeCloseTo(17.7126, 4);

      // 2. Retrieve saved places
      const getRes = await request(app.getHttpServer())
        .get('/v1/riders/saved-locations')
        .set('x-actor-user-id', testRiderUser.id)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(getRes.body.items).toBeDefined();
      expect(Array.isArray(getRes.body.items)).toBe(true);
      expect(
        getRes.body.items.some((item: SavedLocationDto) => item.label === 'Home (Beach Road)'),
      ).toBe(true);
    });
  });
});
