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
  RideStatus,
  RideActorRole,
  RideLedgerEntryDto,
} from '@ecoride/contracts';

describe('Idempotent Rides and Cancellation Policies E2E (EV-039)', () => {
  jest.setTimeout(45000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testRiderAlice = {
    id: 'b0390000-0000-4000-8000-000000000001',
    phone: '+919988776651',
    role: PlatformRole.RIDER,
    name: 'Rider Alice EV-039',
  };

  const testRiderBob = {
    id: 'b0390000-0000-4000-8000-000000000002',
    phone: '+919988776652',
    role: PlatformRole.RIDER,
    name: 'Rider Bob EV-039',
  };

  const testCaptainRavi = {
    id: 'c0390000-0000-4000-8000-000000000001',
    phone: '+919988776653',
    role: PlatformRole.CAPTAIN,
    name: 'Captain Ravi EV-039',
  };

  const testVehicleA = {
    id: 'e0390000-0000-4000-8000-000000000001',
    registrationNumber: 'AP39EV0039',
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
    id: 'c0390000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2026-VZG-039',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90390000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam EV Pilot Corridor EV-039',
    code: 'zone-vizag-ev-corridor-039',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2026-VZG-039',
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
        ALTER TABLE "ride_state_events" DISABLE TRIGGER trg_prevent_ride_state_events_mutation;
        DELETE FROM "ride_state_events" WHERE "booking_id" IN (
          SELECT id FROM "bookings" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}')
        );
        ALTER TABLE "ride_state_events" ENABLE TRIGGER trg_prevent_ride_state_events_mutation;
        DELETE FROM "ride_incidents" WHERE "booking_id" IN (
          SELECT id FROM "bookings" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}')
        );
        DELETE FROM "ledger_entries" WHERE "booking_id" IN (
          SELECT id FROM "bookings" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}')
        );
        DELETE FROM "bookings" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}');
        DELETE FROM "ride_quotes" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}');
        DELETE FROM "vehicles" WHERE "id" = '${testVehicleA.id}';
        DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
        DELETE FROM "service_cities" WHERE "id" = '${testCityVizag.id}' OR "code" = '${testCityVizag.code}';
        DELETE FROM "users" WHERE "id" IN ('${testRiderAlice.id}', '${testRiderBob.id}', '${testCaptainRavi.id}');
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
         ($9, $10, $11, $12, true, NOW(), NOW())
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
        testCaptainRavi.id,
        testCaptainRavi.phone,
        testCaptainRavi.role,
        testCaptainRavi.name,
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
        testVehicleA.id,
        testVehicleA.registrationNumber,
        testVehicleA.propulsionType,
        testVehicleA.vehicleCategory,
        testVehicleA.make,
        testVehicleA.model,
        testVehicleA.batteryCapacityKwh,
        testVehicleA.currentSocPercent,
        testVehicleA.ratedRangeKm,
        testVehicleA.seatingConfiguration,
        testVehicleA.approvedPassengerSeating,
        testVehicleA.totalSeatingCapacity,
        testVehicleA.city,
      ],
    );

    // 3. Insert service city
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

    // 4. Insert polygonal zone
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
  });

  async function createQuoteForAlice(): Promise<{ quoteId: string; quoteToken?: string }> {
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

    return {
      quoteId: res.body.quoteId,
      quoteToken: res.body.quoteToken,
    };
  }

  describe('POST /v1/rides — Concurrency & Idempotency Safeguards', () => {
    it('creates single ride under concurrent double-tap race condition with identical Idempotency-Key', async () => {
      const { quoteId, quoteToken } = await createQuoteForAlice();
      const idempotencyKey = `double-tap-race-${Date.now()}`;

      // Simulate simultaneous double-tap from client
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post('/v1/rides')
          .set('x-actor-user-id', testRiderAlice.id)
          .set('Idempotency-Key', idempotencyKey)
          .send({
            quoteId,
            quoteToken,
            riderId: testRiderAlice.id,
          }),
        request(app.getHttpServer())
          .post('/v1/rides')
          .set('x-actor-user-id', testRiderAlice.id)
          .set('Idempotency-Key', idempotencyKey)
          .send({
            quoteId,
            quoteToken,
            riderId: testRiderAlice.id,
          }),
      ]);

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      // Both requests must return the EXACT same ride booking
      expect(res1.body.bookingId).toBe(res2.body.bookingId);
      expect(res1.body.bookingCode).toBe(res2.body.bookingCode);
      expect(res1.body.idempotencyKey).toBe(idempotencyKey);
      expect(res2.body.idempotencyKey).toBe(idempotencyKey);

      // Verify in DB that exactly ONE booking row was created
      const countRes = await dataSource.query(
        `SELECT COUNT(*) as count FROM "bookings" WHERE "idempotency_key" = $1`,
        [idempotencyKey],
      );
      expect(Number(countRes[0].count)).toBe(1);
    });

    it('rejects creation when no Idempotency-Key is provided', async () => {
      const { quoteId, quoteToken } = await createQuoteForAlice();

      const res = await request(app.getHttpServer())
        .post('/v1/rides')
        .set('x-actor-user-id', testRiderAlice.id)
        .send({
          quoteId,
          quoteToken,
          riderId: testRiderAlice.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe(ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED);
    });

    it('prevents replay attack when quote is already consumed with different idempotency key', async () => {
      const { quoteId, quoteToken } = await createQuoteForAlice();
      const key1 = `legit-key-${Date.now()}`;
      const key2 = `tampered-key-${Date.now()}`;

      // First booking succeeds
      const res1 = await request(app.getHttpServer())
        .post('/v1/rides')
        .set('x-actor-user-id', testRiderAlice.id)
        .set('Idempotency-Key', key1)
        .send({
          quoteId,
          quoteToken,
          riderId: testRiderAlice.id,
        });
      expect(res1.status).toBe(201);

      // Replaying the consumed quote with another key must fail with 409 CONFLICT
      const res2 = await request(app.getHttpServer())
        .post('/v1/rides')
        .set('x-actor-user-id', testRiderAlice.id)
        .set('Idempotency-Key', key2)
        .send({
          quoteId,
          quoteToken,
          riderId: testRiderAlice.id,
        });
      expect(res2.status).toBe(409);
      expect(res2.body.error?.code).toBe(ApiErrorCode.CONFLICT);
    });
  });

  describe('POST /v1/rides/:id/cancel — Policies, Fees & Active Incident Preservation', () => {
    it('allows rider to cancel during REQUESTED status with ₹0 fee', async () => {
      const { quoteId, quoteToken } = await createQuoteForAlice();
      const key = `free-cancel-${Date.now()}`;

      const createRes = await request(app.getHttpServer())
        .post('/v1/rides')
        .set('x-actor-user-id', testRiderAlice.id)
        .set('Idempotency-Key', key)
        .send({
          quoteId,
          quoteToken,
          riderId: testRiderAlice.id,
        });
      const bookingId = createRes.body.bookingId;

      const cancelRes = await request(app.getHttpServer())
        .post(`/v1/rides/${bookingId}/cancel`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .send({
          reason: 'Changed departure plans',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.currentStatus).toBe(RideStatus.CANCELLED);
      expect(cancelRes.body.cancellationFeePaise).toBe(0);
      expect(cancelRes.body.formattedCancellationFee).toBe('₹0.00');
      expect(cancelRes.body.gracePeriodExpired).toBe(false);
      expect(cancelRes.body.ledgerEntriesCreated).toBe(0);
      expect(cancelRes.body.ledgerEntriesPreserved).toBe(true);
    });

    it('assesses ₹15.00 statutory fee and creates double-entry ledger records when rider cancels after 3-minute grace period', async () => {
      const { quoteId, quoteToken } = await createQuoteForAlice();
      const key = `paid-cancel-${Date.now()}`;

      const createRes = await request(app.getHttpServer())
        .post('/v1/rides')
        .set('x-actor-user-id', testRiderAlice.id)
        .set('Idempotency-Key', key)
        .send({
          quoteId,
          quoteToken,
          riderId: testRiderAlice.id,
        });
      const bookingId = createRes.body.bookingId;

      // Assign captain with an assigned_at time 5 minutes in the past
      await dataSource.query(
        `UPDATE "bookings"
         SET "status" = 'ASSIGNED',
             "captain_id" = $1,
             "vehicle_id" = $2,
             "assigned_at" = NOW() - INTERVAL '5 minutes'
         WHERE "id" = $3`,
        [testCaptainRavi.id, testVehicleA.id, bookingId],
      );

      // Rider cancels after grace period (> 3 minutes)
      const cancelRes = await request(app.getHttpServer())
        .post(`/v1/rides/${bookingId}/cancel`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .send({
          reason: 'Emergency meeting, cancelling delayed',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.currentStatus).toBe(RideStatus.CANCELLED);
      expect(cancelRes.body.cancellationFeePaise).toBe(1500); // 1500 paise = ₹15.00
      expect(cancelRes.body.formattedCancellationFee).toBe('₹15.00');
      expect(cancelRes.body.gracePeriodExpired).toBe(true);
      expect(cancelRes.body.ledgerEntriesCreated).toBe(2);
      expect(cancelRes.body.ledgerEntriesPreserved).toBe(true);

      // Check ledger entries API endpoint
      const ledgerRes = await request(app.getHttpServer())
        .get(`/v1/rides/${bookingId}/ledger`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER);

      expect(ledgerRes.status).toBe(200);
      expect(ledgerRes.body).toHaveLength(2);

      const debit = ledgerRes.body.find((e: RideLedgerEntryDto) => e.entryType === 'DEBIT');
      const credit = ledgerRes.body.find((e: RideLedgerEntryDto) => e.entryType === 'CREDIT');

      expect(debit).toBeDefined();
      expect(debit.accountId).toBe(`rider:${testRiderAlice.id}`);
      expect(debit.amountPaise).toBe(1500);

      expect(credit).toBeDefined();
      expect(credit.accountId).toBe(`captain:${testCaptainRavi.id}`);
      expect(credit.amountPaise).toBe(1500);
    });

    it('strictly preserves active incidents upon ride cancellation and prevents erasure', async () => {
      const { quoteId, quoteToken } = await createQuoteForAlice();
      const key = `incident-cancel-${Date.now()}`;

      const createRes = await request(app.getHttpServer())
        .post('/v1/rides')
        .set('x-actor-user-id', testRiderAlice.id)
        .set('Idempotency-Key', key)
        .send({
          quoteId,
          quoteToken,
          riderId: testRiderAlice.id,
        });
      const bookingId = createRes.body.bookingId;

      // 1. Report an active SOS incident on the ride
      const incidentRes = await request(app.getHttpServer())
        .post(`/v1/rides/${bookingId}/incidents`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .send({
          incidentType: 'SOS_TRIGGERED',
          severity: 'HIGH',
          description: 'Passenger feels vehicle vibration hazard',
          metadata: { speedKmph: 35 },
        });

      expect(incidentRes.status).toBe(201);
      expect(incidentRes.body.incidentType).toBe('SOS_TRIGGERED');
      expect(incidentRes.body.status).toBe('REPORTED');
      const incidentCode = incidentRes.body.incidentCode;

      // 2. Now cancel the ride
      const cancelRes = await request(app.getHttpServer())
        .post(`/v1/rides/${bookingId}/cancel`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .send({
          reason: 'Cancelled due to vehicle safety concern',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.currentStatus).toBe(RideStatus.CANCELLED);
      expect(cancelRes.body.activeIncidentsCount).toBe(1);
      expect(cancelRes.body.activeIncidents[0].incidentCode).toBe(incidentCode);

      // 3. Verify incident still exists and was NOT erased or altered
      const getIncidentsRes = await request(app.getHttpServer())
        .get(`/v1/rides/${bookingId}/incidents`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER);

      expect(getIncidentsRes.status).toBe(200);
      expect(getIncidentsRes.body).toHaveLength(1);
      expect(getIncidentsRes.body[0].incidentCode).toBe(incidentCode);
      expect(getIncidentsRes.body[0].status).toBe('REPORTED');

      // 4. Verify database foreign key ON DELETE RESTRICT prevents direct row deletion
      await expect(
        dataSource.query(`DELETE FROM "bookings" WHERE "id" = $1`, [bookingId]),
      ).rejects.toThrow();
    });

    it('prohibits rider from unilaterally cancelling an IN_PROGRESS trip', async () => {
      const { quoteId, quoteToken } = await createQuoteForAlice();
      const key = `in-progress-forbidden-${Date.now()}`;

      const createRes = await request(app.getHttpServer())
        .post('/v1/rides')
        .set('x-actor-user-id', testRiderAlice.id)
        .set('Idempotency-Key', key)
        .send({
          quoteId,
          quoteToken,
          riderId: testRiderAlice.id,
        });
      const bookingId = createRes.body.bookingId;

      await dataSource.query(
        `UPDATE "bookings"
         SET "status" = 'IN_PROGRESS',
             "captain_id" = $1,
             "vehicle_id" = $2,
             "trip_started_at" = NOW()
         WHERE "id" = $3`,
        [testCaptainRavi.id, testVehicleA.id, bookingId],
      );

      const cancelRes = await request(app.getHttpServer())
        .post(`/v1/rides/${bookingId}/cancel`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .send({
          reason: 'Trying to cancel while moving',
        });

      expect(cancelRes.status).toBe(403);
      expect(cancelRes.body.error?.code).toBe(ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR);
    });
  });
});
