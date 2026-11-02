import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { CreateServiceCitiesAndExpandServiceZones1700000000014 } from '../src/database/migrations/1700000000014-CreateServiceCitiesAndExpandServiceZones';
import {
  PlatformRole,
  ZoneOperationalStatus,
  CityOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  ApiErrorCode,
} from '@ecoride/contracts';

describe('Service Cities & Authorized Geofences E2E (EV-031)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;
  let dataSource: DataSource;

  // Platform Operator User
  const operatorUser = {
    id: 'e0111111-1111-4000-8000-000000000001',
    phone: '+919876300099',
    role: PlatformRole.OPERATOR,
    name: 'Ramesh Operations Controller',
  };

  // Service Cities
  const cityVizag = {
    id: 'c0111111-1111-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2025-VIZAG-001',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  // Zones
  const zoneBeachRoad = {
    id: '90111111-1111-4000-8000-000000000001',
    name: 'Visakhapatnam Beach Road EV Corridor',
    code: 'zone-beach-road-vizag',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2025-BR-001',
    permitExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    centerLatitude: 17.715,
    centerLongitude: 83.315,
    categorySwitches: {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      CITY_COMMUTE_2W: true,
      CAB_PRIVATE_4W: false,
    },
    boundary: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [83.28, 17.68],
          [83.35, 17.68],
          [83.35, 17.75],
          [83.28, 17.75],
          [83.28, 17.68],
        ],
      ],
    },
  };

  const zoneRushikondaExpired = {
    id: '90222222-2222-4000-8000-000000000002',
    name: 'Rushikonda IT Hill SEZ',
    code: 'zone-rushikonda-expired',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2024-EXP-999',
    permitExpiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Expired 30 days ago
    centerLatitude: 17.78,
    centerLongitude: 83.39,
    categorySwitches: {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      CITY_COMMUTE_2W: true,
      CAB_PRIVATE_4W: true,
    },
    boundary: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [83.36, 17.76],
          [83.42, 17.76],
          [83.42, 17.82],
          [83.36, 17.82],
          [83.36, 17.76],
        ],
      ],
    },
  };

  const zoneGajuwakaSuspended = {
    id: '90333333-3333-4000-8000-000000000003',
    name: 'Gajuwaka Industrial Corridor',
    code: 'zone-gajuwaka-suspended',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.SUSPENDED,
    evidenceReference: 'AP-STA-SUSPEND-2025-GAJ-001',
    permitExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    centerLatitude: 17.67,
    centerLongitude: 83.21,
    categorySwitches: {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      CITY_COMMUTE_2W: true,
    },
    boundary: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [83.18, 17.65],
          [83.25, 17.65],
          [83.25, 17.7],
          [83.18, 17.7],
          [83.18, 17.65],
        ],
      ],
    },
  };

  async function cleanupTestData() {
    if (!dataSource || !dataSource.isInitialized) return;

    await dataSource.query(`
      DELETE FROM "audit_events" WHERE "actor_id" = '${operatorUser.id}'
        OR "entity_id" IN ('${zoneBeachRoad.id}', '${zoneRushikondaExpired.id}', '${zoneGajuwakaSuspended.id}', '${cityVizag.id}');
      DELETE FROM "zones" WHERE "id" IN ('${zoneBeachRoad.id}', '${zoneRushikondaExpired.id}', '${zoneGajuwakaSuspended.id}')
        OR "code" IN ('${zoneBeachRoad.code}', '${zoneRushikondaExpired.code}', '${zoneGajuwakaSuspended.code}', 'zone-vja-central');
      DELETE FROM "service_cities" WHERE "id" = '${cityVizag.id}'
        OR "code" IN ('${cityVizag.code}', 'vijayawada');
      DELETE FROM "users" WHERE "id" = '${operatorUser.id}' OR "phone" = '${operatorUser.phone}';
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
      try {
        await new CreateServiceCitiesAndExpandServiceZones1700000000014().up(
          dataSource.createQueryRunner(),
        );
      } catch {
        // Schema table and columns already exist
      }

      await cleanupTestData();

      // Seed Operator User
      await dataSource.query(`
        INSERT INTO "users" ("id", "phone", "role", "name", "is_active")
        VALUES ('${operatorUser.id}', '${operatorUser.phone}', '${operatorUser.role}', '${operatorUser.name}', true);
      `);

      // Seed City
      await dataSource.query(`
        INSERT INTO "service_cities" (
          "id", "code", "name", "state", "operational_status", "evidence_reference",
          "permit_expires_at", "category_switches", "center_latitude", "center_longitude"
        ) VALUES (
          '${cityVizag.id}', '${cityVizag.code}', '${cityVizag.name}', '${cityVizag.state}',
          '${cityVizag.operationalStatus}', '${cityVizag.evidenceReference}',
          '${zoneBeachRoad.permitExpiresAt}', '${JSON.stringify(zoneBeachRoad.categorySwitches)}'::jsonb,
          ${cityVizag.centerLatitude}, ${cityVizag.centerLongitude}
        );
      `);

      // Seed Zones (Using PostGIS ST_GeomFromGeoJSON for accurate spatial queries)
      await dataSource.query(`
        INSERT INTO "zones" (
          "id", "name", "city", "boundary", "code", "operational_status", "evidence_reference",
          "permit_expires_at", "category_switches", "center_latitude", "center_longitude"
        ) VALUES
          (
            '${zoneBeachRoad.id}', '${zoneBeachRoad.name}', '${zoneBeachRoad.city}',
            ST_GeomFromGeoJSON('${JSON.stringify(zoneBeachRoad.boundary)}'),
            '${zoneBeachRoad.code}', '${zoneBeachRoad.operationalStatus}', '${zoneBeachRoad.evidenceReference}',
            '${zoneBeachRoad.permitExpiresAt}', '${JSON.stringify(zoneBeachRoad.categorySwitches)}'::jsonb,
            ${zoneBeachRoad.centerLatitude}, ${zoneBeachRoad.centerLongitude}
          ),
          (
            '${zoneRushikondaExpired.id}', '${zoneRushikondaExpired.name}', '${zoneRushikondaExpired.city}',
            ST_GeomFromGeoJSON('${JSON.stringify(zoneRushikondaExpired.boundary)}'),
            '${zoneRushikondaExpired.code}', '${zoneRushikondaExpired.operationalStatus}', '${zoneRushikondaExpired.evidenceReference}',
            '${zoneRushikondaExpired.permitExpiresAt}', '${JSON.stringify(zoneRushikondaExpired.categorySwitches)}'::jsonb,
            ${zoneRushikondaExpired.centerLatitude}, ${zoneRushikondaExpired.centerLongitude}
          ),
          (
            '${zoneGajuwakaSuspended.id}', '${zoneGajuwakaSuspended.name}', '${zoneGajuwakaSuspended.city}',
            ST_GeomFromGeoJSON('${JSON.stringify(zoneGajuwakaSuspended.boundary)}'),
            '${zoneGajuwakaSuspended.code}', '${zoneGajuwakaSuspended.operationalStatus}', '${zoneGajuwakaSuspended.evidenceReference}',
            '${zoneGajuwakaSuspended.permitExpiresAt}', '${JSON.stringify(zoneGajuwakaSuspended.categorySwitches)}'::jsonb,
            ${zoneGajuwakaSuspended.centerLatitude}, ${zoneGajuwakaSuspended.centerLongitude}
          );
      `);
    }
  }, 35000);

  afterAll(async () => {
    await cleanupTestData();
    if (app) {
      await app.close();
    }
  }, 35000);

  describe('1. Acceptance: Server-Side Polygonal Geofence & Category Authorization', () => {
    it('should AUTHORIZE request inside Beach Road corridor with enabled category CITY_COMMUTE_2W', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.715,
          longitude: 83.315,
          serviceCategory: 'CITY_COMMUTE_2W',
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(true);
      expect(res.body.isInsideGeofence).toBe(true);
      expect(res.body.isPermitValid).toBe(true);
      expect(res.body.isCategoryEnabled).toBe(true);
      expect(res.body.zoneCode).toBe('zone-beach-road-vizag');
      expect(res.body.zoneName).toBe('Visakhapatnam Beach Road EV Corridor');
      expect(res.body.city).toBe('visakhapatnam');
    });

    it('should REJECT request inside Beach Road corridor when category switch is disabled (CAB_PRIVATE_4W)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.715,
          longitude: 83.315,
          serviceCategory: 'CAB_PRIVATE_4W',
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(false);
      expect(res.body.isInsideGeofence).toBe(true);
      expect(res.body.isCategoryEnabled).toBe(false);
      expect(res.body.rejectionReason).toContain('disabled');
    });

    it('ACCEPTANCE: should REJECT even when client forges availability (clientForgedAvailability: true)', async () => {
      // Malicious or modified client tries to bypass server switch by supplying forged availability
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.715,
          longitude: 83.315,
          serviceCategory: 'CAB_PRIVATE_4W',
          clientForgedAvailability: true,
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(false);
      expect(res.body.isInsideGeofence).toBe(true);
      expect(res.body.isCategoryEnabled).toBe(false);
      expect(res.body.rejectionReason).toContain('disabled');
      expect(res.body.rejectionReason).toContain('Visakhapatnam Beach Road EV Corridor');
    });

    it('should REJECT request inside Rushikonda zone when statutory permit is EXPIRED', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.78,
          longitude: 83.39,
          serviceCategory: 'CITY_COMMUTE_2W',
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(false);
      expect(res.body.isInsideGeofence).toBe(true);
      expect(res.body.isPermitValid).toBe(false);
      expect(res.body.rejectionReason).toContain('expired');
    });

    it('should REJECT request inside Gajuwaka zone when operational status is SUSPENDED', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.67,
          longitude: 83.21,
          serviceCategory: 'CITY_COMMUTE_2W',
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(false);
      expect(res.body.isInsideGeofence).toBe(true);
      expect(res.body.rejectionReason).toContain('SUSPENDED');
    });

    it('should REJECT request outside all approved service geofences (rural / offshore coordinates)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.4,
          longitude: 84.5, // Offshore waters
          serviceCategory: 'CITY_COMMUTE_2W',
        })
        .expect(200);

      expect(res.body.isAuthorized).toBe(false);
      expect(res.body.isInsideGeofence).toBe(false);
      expect(res.body.rejectionReason).toContain('outside authorized');
    });
  });

  describe('2. Operator Category Switch Toggling & Auditing', () => {
    it('should allow operator to toggle category switch with statutory evidence reference', async () => {
      // Operator enables CAB_PRIVATE_4W for Beach Road corridor
      const res = await request(app.getHttpServer())
        .patch(`/v1/zones/${zoneBeachRoad.id}/category-switch`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          serviceCategory: 'CAB_PRIVATE_4W',
          isEnabled: true,
          evidenceReference: 'AP-STA-PERMIT-2025-EXPAND-CAB-4W',
        })
        .expect(200);

      expect(res.body.categorySwitches.CAB_PRIVATE_4W).toBe(true);
      expect(res.body.evidenceReference).toBe('AP-STA-PERMIT-2025-EXPAND-CAB-4W');

      // Re-verifying location now authorizes CAB_PRIVATE_4W
      const verifyRes = await request(app.getHttpServer())
        .post('/v1/zones/verify-location')
        .send({
          city: 'visakhapatnam',
          latitude: 17.715,
          longitude: 83.315,
          serviceCategory: 'CAB_PRIVATE_4W',
        })
        .expect(200);

      expect(verifyRes.body.isAuthorized).toBe(true);
      expect(verifyRes.body.isCategoryEnabled).toBe(true);

      // Verify audit record was inserted
      const audits = await dataSource.query(`
        SELECT * FROM "audit_events"
        WHERE "entity_id" = '${zoneBeachRoad.id}' AND "action" = 'ZONE_CATEGORY_SWITCH_TOGGLED';
      `);
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits[0].actor_id).toBe(operatorUser.id);
    });

    it('should reject toggling invalid or unknown service category', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/zones/${zoneBeachRoad.id}/category-switch`)
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          serviceCategory: 'DIESEL_BUS', // Invalid category
          enabled: true,
          statutoryEvidenceReference: 'AP-STA-PERMIT-INVALID',
        })
        .expect(400);
    });
  });

  describe('3. Service City Management & Default Disabled Categories', () => {
    it('should list configured service cities', async () => {
      const res = await request(app.getHttpServer()).get('/v1/zones/cities').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const vizag = res.body.find((c: { code: string }) => c.code === 'visakhapatnam');
      expect(vizag).toBeDefined();
      expect(vizag.name).toBe('Visakhapatnam');
    });

    it('should create new service city with all real categories disabled by default', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones/cities')
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          code: 'vijayawada',
          name: 'Vijayawada',
          state: 'Andhra Pradesh',
          operationalStatus: CityOperationalStatus.PILOT,
          evidenceReference: 'AP-STA-CITY-2025-VJA-PILOT-01',
          centerLatitude: 16.5062,
          centerLongitude: 80.648,
        })
        .expect(201);

      expect(res.body.code).toBe('vijayawada');
      expect(res.body.operationalStatus).toBe(CityOperationalStatus.PILOT);
      // Verify all real categories default to false
      expect(res.body.categorySwitches.CITY_COMMUTE_2W).toBe(false);
      expect(res.body.categorySwitches.CAB_PRIVATE_4W).toBe(false);
      expect(res.body.categorySwitches.AUTO_COMMUTE_3W).toBe(false);
      expect(res.body.categorySwitches.VAN_COMMUTE_4W).toBe(false);
    });

    it('should reject registering duplicate city code (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/v1/zones/cities')
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          code: 'visakhapatnam', // Duplicate
          name: 'Visakhapatnam Duplicate',
          state: 'Andhra Pradesh',
          operationalStatus: CityOperationalStatus.ACTIVE,
          evidenceReference: 'AP-STA-DUP-01',
          centerLatitude: 17.68,
          centerLongitude: 83.21,
        })
        .expect(409);
    });

    it('should create new polygonal service zone with default disabled categories', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/zones')
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          name: 'Vijayawada Central EV Zone',
          code: 'zone-vja-central',
          city: 'vijayawada',
          operationalStatus: ZoneOperationalStatus.PILOT,
          evidenceReference: 'AP-STA-ZONE-2025-VJA-01',
          centerLatitude: 16.5062,
          centerLongitude: 80.648,
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [80.6, 16.48],
                [80.7, 16.48],
                [80.7, 16.55],
                [80.6, 16.55],
                [80.6, 16.48],
              ],
            ],
          },
        })
        .expect(201);

      expect(res.body.code).toBe('zone-vja-central');
      expect(res.body.operationalStatus).toBe(ZoneOperationalStatus.PILOT);
      expect(res.body.categorySwitches.CITY_COMMUTE_2W).toBe(false);
      expect(res.body.categorySwitches.CAB_PRIVATE_4W).toBe(false);
    });

    it('should reject creating polygonal zone with invalid non-closed polygon', async () => {
      await request(app.getHttpServer())
        .post('/v1/zones')
        .set('x-actor-user-id', operatorUser.id)
        .set('x-actor-role', operatorUser.role)
        .send({
          name: 'Invalid Polygon Zone',
          code: 'zone-invalid-poly',
          city: 'visakhapatnam',
          operationalStatus: ZoneOperationalStatus.PILOT,
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [80.6, 16.48],
                [80.7, 16.48],
                [80.7, 16.55],
                // Missing closing coordinate!
              ],
            ],
          },
        })
        .expect(400);
    });
  });

  describe('4. Authoritative Quote Integration (/v1/quotes/authoritative)', () => {
    it('should generate authoritative quote inside approved geofence with enabled category', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.715,
          pickupLongitude: 83.315,
          dropoffLatitude: 17.7275,
          dropoffLongitude: 83.3038,
        })
        .expect(200);

      expect(res.body.quoteId).toBeDefined();
      expect(res.body.fare.amountPaise).toBeGreaterThan(0);
      expect(res.body.fare.currency).toBe('INR');
      expect(res.body.expiresAt).toBeDefined();
    });

    it('should reject authoritative quote outside approved geofence (ZONE_RESTRICTED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.4, // Outside geofence
          pickupLongitude: 84.5,
          dropoffLatitude: 17.7275,
          dropoffLongitude: 83.3038,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.ZONE_RESTRICTED);
      expect(res.body.error.message).toContain('outside authorized');
    });

    it('should reject authoritative quote when category is disabled even if client attempts to forge', async () => {
      // Test in Vijayawada where CAB_PRIVATE_4W is disabled
      const res = await request(app.getHttpServer())
        .post('/v1/quotes/authoritative')
        .send({
          city: 'vijayawada',
          serviceCategory: 'CAB_PRIVATE_4W',
          pickupLatitude: 16.51,
          pickupLongitude: 80.65,
          dropoffLatitude: 16.52,
          dropoffLongitude: 80.66,
          clientForgedAvailability: true,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ApiErrorCode.ZONE_RESTRICTED);
      expect(res.body.error.message).toContain('disabled in zone');
    });
  });
});
