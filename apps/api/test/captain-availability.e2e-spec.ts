import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import {
  PlatformRole,
  CaptainAvailabilityStatus,
  DutyStatus,
  ApiErrorCode,
  CityOperationalStatus,
  ZoneOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  AvailableCaptainSummaryDto,
} from '@ecoride/contracts';

describe('Captain Availability and Location Freshness E2E (EV-040)', () => {
  jest.setTimeout(45000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testCaptainAlice = {
    id: 'a0400000-0000-4000-8000-000000000001',
    phone: '+919988776641',
    role: PlatformRole.CAPTAIN,
    name: 'Captain Alice EV-040',
  };

  const testCaptainBob = {
    id: 'b0400000-0000-4000-8000-000000000002',
    phone: '+919988776642',
    role: PlatformRole.CAPTAIN,
    name: 'Captain Bob EV-040',
  };

  const testRiderCharlie = {
    id: 'c0400000-0000-4000-8000-000000000003',
    phone: '+919988776643',
    role: PlatformRole.RIDER,
    name: 'Rider Charlie EV-040',
  };

  const testAdminDave = {
    id: 'd0400000-0000-4000-8000-000000000004',
    phone: '+919988776644',
    role: PlatformRole.SUPER_ADMIN,
    name: 'Admin Dave EV-040',
  };

  const testVehicleAlice = {
    id: 'e0400000-0000-4000-8000-000000000001',
    registrationNumber: 'AP39EV0040A',
    make: 'Ola Electric',
    model: 'S1 Pro Gen 2',
    propulsionType: 'BATTERY_ELECTRIC',
    batteryCapacityKwh: 4.0,
    vehicleCategory: 'CITY_COMMUTE_2W',
    currentSocPercent: 95.0,
    ratedRangeKm: 180,
    seatingConfiguration: 'D+1',
    approvedPassengerSeating: 1,
    totalSeatingCapacity: 2,
    city: 'visakhapatnam',
  };

  const testCityVizag = {
    id: 'c0400000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2026-VZG-040',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90400000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam EV Pilot Corridor EV-040',
    code: 'zone-vizag-ev-corridor-040',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2026-VZG-040',
    permitExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    centerLatitude: 17.72,
    centerLongitude: 83.31,
    categorySwitches: {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      CITY_COMMUTE_2W: true,
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

    try {
      await dataSource.query(`
        DELETE FROM "captain_location_pings" WHERE "driver_profile_id" IN (
          SELECT id FROM "driver_profiles" WHERE "user_id" IN ('${testCaptainAlice.id}', '${testCaptainBob.id}')
        );
        DELETE FROM "driver_profiles" WHERE "user_id" IN ('${testCaptainAlice.id}', '${testCaptainBob.id}');
        DELETE FROM "vehicles" WHERE "id" = '${testVehicleAlice.id}';
        DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
        DELETE FROM "users" WHERE "id" IN (
          '${testCaptainAlice.id}',
          '${testCaptainBob.id}',
          '${testRiderCharlie.id}',
          '${testAdminDave.id}'
        );
      `);
    } catch {
      // Ignored if clean
    }
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

    // 1. Insert test users
    await dataSource.query(
      `INSERT INTO "users" ("id", "phone", "role", "name", "is_active", "created_at", "updated_at")
       VALUES
         ($1, $2, $3, $4, true, NOW(), NOW()),
         ($5, $6, $7, $8, true, NOW(), NOW()),
         ($9, $10, $11, $12, true, NOW(), NOW()),
         ($13, $14, $15, $16, true, NOW(), NOW())
       ON CONFLICT ("id") DO NOTHING`,
      [
        testCaptainAlice.id,
        testCaptainAlice.phone,
        testCaptainAlice.role,
        testCaptainAlice.name,
        testCaptainBob.id,
        testCaptainBob.phone,
        testCaptainBob.role,
        testCaptainBob.name,
        testRiderCharlie.id,
        testRiderCharlie.phone,
        testRiderCharlie.role,
        testRiderCharlie.name,
        testAdminDave.id,
        testAdminDave.phone,
        testAdminDave.role,
        testAdminDave.name,
      ],
    );

    // 2. Insert test 100% BEV vehicle
    await dataSource.query(
      `INSERT INTO "vehicles" (
         "id", "registration_number", "propulsion_type", "vehicle_category", "make", "model",
         "battery_capacity_kwh", "current_soc_percent", "rated_range_km", "seating_configuration",
         "approved_passenger_seating", "total_seating_capacity", "green_plate_verified",
         "verification_status", "city", "is_active"
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, 'VERIFIED', $13, true)
       ON CONFLICT ("id") DO NOTHING`,
      [
        testVehicleAlice.id,
        testVehicleAlice.registrationNumber,
        testVehicleAlice.propulsionType,
        testVehicleAlice.vehicleCategory,
        testVehicleAlice.make,
        testVehicleAlice.model,
        testVehicleAlice.batteryCapacityKwh,
        testVehicleAlice.currentSocPercent,
        testVehicleAlice.ratedRangeKm,
        testVehicleAlice.seatingConfiguration,
        testVehicleAlice.approvedPassengerSeating,
        testVehicleAlice.totalSeatingCapacity,
        testVehicleAlice.city,
      ],
    );

    // 3. Insert driver profiles
    await dataSource.query(
      `INSERT INTO "driver_profiles" (
         "id", "user_id", "license_number", "verification_status", "duty_status",
         "availability_status", "green_plate_permit_verified", "safety_training_completed",
         "rating_average", "total_trips", "city", "battery_soc_percent", "assigned_vehicle_id"
       )
       VALUES
         ('df400000-0000-4000-8000-000000000001', $1, 'AP39-2026-0401', 'VERIFIED', 'OFFLINE', 'OFFLINE', true, true, 4.95, 60, 'visakhapatnam', 95.0, $3),
         ('df400000-0000-4000-8000-000000000002', $2, 'AP39-2026-0402', 'VERIFIED', 'OFFLINE', 'OFFLINE', true, true, 4.88, 45, 'visakhapatnam', 90.0, NULL)
       ON CONFLICT ("user_id") DO NOTHING`,
      [testCaptainAlice.id, testCaptainBob.id, testVehicleAlice.id],
    );

    // 4. Insert service city
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

    // 5. Insert polygonal zone
    await dataSource.query(
      `INSERT INTO "zones" (
         "id", "name", "code", "city", "operational_status", "evidence_reference",
         "permit_expires_at", "center_latitude", "center_longitude", "category_switches",
         "boundary"
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         ST_SetSRID(ST_GeomFromGeoJSON($11), 4326)
       )
       ON CONFLICT ("code") DO UPDATE SET "operational_status" = $5, "category_switches" = $10`,
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
        JSON.stringify(testZoneBeachRoad.boundary),
      ],
    );
  });

  afterAll(async () => {
    await cleanupTestData();
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('1. Captain Availability Lifecycle Transitions (EV-040)', () => {
    it('allows verified captain Alice to transition to AVAILABLE', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/availability')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          status: CaptainAvailabilityStatus.AVAILABLE,
          batterySocPercent: 92.0,
        })
        .expect(200);

      expect(res.body.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      expect(res.body.dutyStatus).toBe(DutyStatus.ONLINE);
      expect(Number(res.body.batterySocPercent)).toBe(92.0);

      // Verify DB row
      const [row] = await dataSource.query(
        `SELECT availability_status, duty_status, battery_soc_percent FROM "driver_profiles" WHERE "user_id" = $1`,
        [testCaptainAlice.id],
      );
      expect(row.availability_status).toBe('AVAILABLE');
      expect(row.duty_status).toBe('ONLINE');
      expect(Number(row.battery_soc_percent)).toBe(92.0);
    });

    it('retrieves current captain availability via GET /v1/captains/me/availability', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/availability')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .expect(200);

      expect(res.body.userId).toBe(testCaptainAlice.id);
      expect(res.body.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      expect(res.body.dutyStatus).toBe(DutyStatus.ONLINE);
    });
  });

  describe('2. Authenticated Location Updates & Telemetry Freshness (EV-040)', () => {
    it('records valid location ping with high GPS accuracy and updates PostGIS point', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/location')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          latitude: 17.7126,
          longitude: 83.3174,
          accuracyMeters: 8.5,
          headingDegrees: 45.0,
          speedKmph: 24.0,
          batterySocPercent: 91.5,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.latitude).toBeCloseTo(17.7126, 4);
      expect(res.body.longitude).toBeCloseTo(83.3174, 4);
      expect(res.body.accuracyMeters).toBe(8.5);

      // Verify DB spatial point
      const [row] = await dataSource.query(
        `SELECT current_latitude, current_longitude, ST_AsText(current_location) as geom, location_accuracy_meters, battery_soc_percent
         FROM "driver_profiles" WHERE "user_id" = $1`,
        [testCaptainAlice.id],
      );
      expect(Number(row.current_latitude)).toBeCloseTo(17.7126, 4);
      expect(Number(row.current_longitude)).toBeCloseTo(83.3174, 4);
      expect(row.geom).toContain('POINT(83.3174 17.7126)');
      expect(Number(row.location_accuracy_meters)).toBe(8.5);

      // Verify captain_location_pings audit trail
      const pings = await dataSource.query(
        `SELECT * FROM "captain_location_pings" WHERE "driver_profile_id" = 'df400000-0000-4000-8000-000000000001'`,
      );
      expect(pings.length).toBeGreaterThan(0);
    });

    it('rejects location ping with unacceptable accuracy (> 50m limit)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/location')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          latitude: 17.7126,
          longitude: 83.3174,
          accuracyMeters: 75.0, // Exceeds MAX_LOCATION_ACCURACY_METERS (50.0)
          batterySocPercent: 90.0,
        })
        .expect(422);

      expect(res.body.code).toBe(ApiErrorCode.LOCATION_ACCURACY_UNACCEPTABLE);
    });

    it('rejects location ping with insufficient battery (< 20% limit)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/location')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          latitude: 17.7126,
          longitude: 83.3174,
          accuracyMeters: 10.0,
          batterySocPercent: 14.5, // Below MIN_BATTERY_SOC_PERCENT (20.0)
        })
        .expect(422);

      expect(res.body.code).toBe(ApiErrorCode.BATTERY_SOC_INSUFFICIENT);
    });
  });

  describe('3. Dispatch Offer Eligibility Evaluation (EV-040)', () => {
    it('evaluates Alice as eligible for dispatch when AVAILABLE with fresh telemetry', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/dispatch-eligibility')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .expect(200);

      expect(res.body.isEligibleForDispatch).toBe(true);
      expect(res.body.isLocationFresh).toBe(true);
      expect(res.body.isAccuracyAcceptable).toBe(true);
      expect(res.body.isSocSufficient).toBe(true);
      expect(res.body.reasons).toEqual([]);
    });

    it('includes Alice in radial proximity search of available captains', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/captains/available')
        .query({
          latitude: 17.712,
          longitude: 83.317,
          radiusKm: 5,
        })
        .set('x-actor-user-id', testRiderCharlie.id)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const match = (res.body as AvailableCaptainSummaryDto[]).find(
        (c: AvailableCaptainSummaryDto) => c.userId === testCaptainAlice.id,
      );
      expect(match).toBeDefined();
      expect(match?.availabilityStatus).toBe(CaptainAvailabilityStatus.AVAILABLE);
      expect(match?.distanceMeters).toBeGreaterThan(0);
      expect(match?.distanceMeters).toBeLessThan(5000);
    });
  });

  describe('4. Demonstration: Stale, Offline, Charging & Maintenance Exclusions (EV-040)', () => {
    it('demonstrates that CHARGING captains cannot receive dispatch offers', async () => {
      // Transition Alice to CHARGING
      await request(app.getHttpServer())
        .post('/v1/captains/me/availability')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          status: CaptainAvailabilityStatus.CHARGING,
          statusReason: 'Depot DC Fast Charging at Vizag RTC Complex',
          batterySocPercent: 45.0,
        })
        .expect(200);

      // Check dispatch eligibility
      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/dispatch-eligibility')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .expect(200);

      expect(res.body.isEligibleForDispatch).toBe(false);
      expect(res.body.availabilityStatus).toBe(CaptainAvailabilityStatus.CHARGING);
      expect(res.body.reasons.some((r: string) => r.includes('CHARGING'))).toBe(true);

      // Verify Alice is excluded from available captains search
      const searchRes = await request(app.getHttpServer())
        .get('/v1/captains/available')
        .query({
          latitude: 17.712,
          longitude: 83.317,
          radiusKm: 5,
        })
        .set('x-actor-user-id', testRiderCharlie.id)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      const found = (searchRes.body as AvailableCaptainSummaryDto[]).find(
        (c: AvailableCaptainSummaryDto) => c.userId === testCaptainAlice.id,
      );
      expect(found).toBeUndefined();
    });

    it('demonstrates that MAINTENANCE captains cannot receive dispatch offers', async () => {
      // Transition Alice to MAINTENANCE
      await request(app.getHttpServer())
        .post('/v1/captains/me/availability')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          status: CaptainAvailabilityStatus.MAINTENANCE,
          statusReason: 'Brake pad inspection at authorized service center',
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/dispatch-eligibility')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .expect(200);

      expect(res.body.isEligibleForDispatch).toBe(false);
      expect(res.body.availabilityStatus).toBe(CaptainAvailabilityStatus.MAINTENANCE);
      expect(res.body.reasons.some((r: string) => r.includes('MAINTENANCE'))).toBe(true);
    });

    it('demonstrates that OFFLINE captains cannot receive dispatch offers', async () => {
      // Transition Alice to OFFLINE
      await request(app.getHttpServer())
        .post('/v1/captains/me/availability')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          status: CaptainAvailabilityStatus.OFFLINE,
        })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/dispatch-eligibility')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .expect(200);

      expect(res.body.isEligibleForDispatch).toBe(false);
      expect(res.body.availabilityStatus).toBe(CaptainAvailabilityStatus.OFFLINE);
      expect(res.body.reasons.some((r: string) => r.includes('OFFLINE'))).toBe(true);
    });

    it('demonstrates that STALE location captains (> 30s) cannot receive dispatch offers', async () => {
      // Put Alice back to AVAILABLE with fresh status
      await request(app.getHttpServer())
        .post('/v1/captains/me/availability')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          status: CaptainAvailabilityStatus.AVAILABLE,
          batterySocPercent: 95.0,
        })
        .expect(200);

      // Intentionally age Alice's location telemetry by 60 seconds (simulating missed pings)
      await dataSource.query(
        `UPDATE "driver_profiles"
         SET "location_updated_at" = NOW() - INTERVAL '60 seconds'
         WHERE "user_id" = $1`,
        [testCaptainAlice.id],
      );

      // Verify dispatch eligibility strictly rejects stale telemetry
      const res = await request(app.getHttpServer())
        .get('/v1/captains/me/dispatch-eligibility')
        .set('x-actor-user-id', testCaptainAlice.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .expect(200);

      expect(res.body.isEligibleForDispatch).toBe(false);
      expect(res.body.isLocationFresh).toBe(false);
      expect(res.body.locationAgeSeconds).toBeGreaterThanOrEqual(55);
      expect(res.body.reasons.some((r: string) => r.includes('Telemetry is stale'))).toBe(true);

      // Verify stale captain is excluded from radial proximity search
      const searchRes = await request(app.getHttpServer())
        .get('/v1/captains/available')
        .query({
          latitude: 17.712,
          longitude: 83.317,
          radiusKm: 5,
        })
        .set('x-actor-user-id', testRiderCharlie.id)
        .set('x-actor-role', PlatformRole.RIDER)
        .expect(200);

      const found = (searchRes.body as AvailableCaptainSummaryDto[]).find(
        (c: AvailableCaptainSummaryDto) => c.userId === testCaptainAlice.id,
      );
      expect(found).toBeUndefined();
    });
  });

  describe('5. Actor Authorization & Cross-Account Tampering Safeguards (EV-040)', () => {
    it('strictly forbids Captain Bob from updating Captain Alice availability state', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/captains/${testCaptainAlice.id}/availability`)
        .set('x-actor-user-id', testCaptainBob.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          status: CaptainAvailabilityStatus.OFFLINE,
        })
        .expect(403);

      expect(res.body.message).toContain('Forbidden');
    });

    it('strictly forbids Captain Bob from recording location for Captain Alice', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/captains/${testCaptainAlice.id}/location`)
        .set('x-actor-user-id', testCaptainBob.id)
        .set('x-actor-role', PlatformRole.CAPTAIN)
        .send({
          latitude: 17.7126,
          longitude: 83.3174,
          accuracyMeters: 10.0,
        })
        .expect(403);

      expect(res.body.message).toContain('Forbidden');
    });

    it('strictly forbids Rider Charlie from updating captain availability', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/captains/me/availability')
        .set('x-actor-user-id', testRiderCharlie.id)
        .set('x-actor-role', PlatformRole.RIDER)
        .send({
          status: CaptainAvailabilityStatus.AVAILABLE,
        })
        .expect(403);

      expect(res.body.message).toContain('Only captains or operational dispatchers');
    });

    it('allows Super Admin Dave to inspect Captain Alice availability and eligibility', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/captains/${testCaptainAlice.id}/availability`)
        .set('x-actor-user-id', testAdminDave.id)
        .set('x-actor-role', PlatformRole.SUPER_ADMIN)
        .expect(200);

      expect(res.body.userId).toBe(testCaptainAlice.id);

      const eligRes = await request(app.getHttpServer())
        .get(`/v1/captains/${testCaptainAlice.id}/dispatch-eligibility`)
        .set('x-actor-user-id', testAdminDave.id)
        .set('x-actor-role', PlatformRole.SUPER_ADMIN)
        .expect(200);

      expect(eligRes.body.userId).toBe(testCaptainAlice.id);
    });
  });
});
