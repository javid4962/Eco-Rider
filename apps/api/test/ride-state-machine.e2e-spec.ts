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
} from '@ecoride/contracts';

describe('Ride State Machine & Authorization E2E (EV-038)', () => {
  jest.setTimeout(45000);

  let app: INestApplication;
  let dataSource: DataSource;

  const testRiderAlice = {
    id: 'b0380000-0000-4000-8000-000000000001',
    phone: '+919988776641',
    role: PlatformRole.RIDER,
    name: 'Rider Alice EV-038',
  };

  const testRiderBob = {
    id: 'b0380000-0000-4000-8000-000000000002',
    phone: '+919988776642',
    role: PlatformRole.RIDER,
    name: 'Rider Bob EV-038',
  };

  const testCaptainRavi = {
    id: 'c0380000-0000-4000-8000-000000000001',
    phone: '+919988776643',
    role: PlatformRole.CAPTAIN,
    name: 'Captain Ravi EV-038',
  };

  const testCaptainKiran = {
    id: 'c0380000-0000-4000-8000-000000000002',
    phone: '+919988776644',
    role: PlatformRole.CAPTAIN,
    name: 'Captain Kiran EV-038',
  };

  const testVehicleA = {
    id: 'e0380000-0000-4000-8000-000000000001',
    registrationNumber: 'AP39EV0038',
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
    id: 'c0380000-0000-4000-8000-000000000001',
    code: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    operationalStatus: CityOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-CITY-2026-VZG-038',
    centerLatitude: 17.6868,
    centerLongitude: 83.2185,
  };

  const testZoneBeachRoad = {
    id: '90380000-0000-4000-8000-000000000001',
    name: 'Visakhapatnam EV Pilot Corridor EV-038',
    code: 'zone-vizag-ev-corridor-038',
    city: 'visakhapatnam',
    operationalStatus: ZoneOperationalStatus.ACTIVE,
    evidenceReference: 'AP-STA-ZONE-2026-VZG-038',
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

    await dataSource.query(`
      ALTER TABLE "ride_state_events" DISABLE TRIGGER trg_prevent_ride_state_events_mutation;
      DELETE FROM "ride_state_events" WHERE "booking_id" IN (
        SELECT id FROM "bookings" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}')
      );
      ALTER TABLE "ride_state_events" ENABLE TRIGGER trg_prevent_ride_state_events_mutation;
      DELETE FROM "bookings" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}');
      DELETE FROM "ride_quotes" WHERE "rider_id" IN ('${testRiderAlice.id}', '${testRiderBob.id}');
      DELETE FROM "vehicles" WHERE "id" = '${testVehicleA.id}';
      DELETE FROM "zones" WHERE "id" = '${testZoneBeachRoad.id}' OR "code" = '${testZoneBeachRoad.code}';
      DELETE FROM "service_cities" WHERE "id" = '${testCityVizag.id}' OR "code" = '${testCityVizag.code}';
      DELETE FROM "users" WHERE "id" IN ('${testRiderAlice.id}', '${testRiderBob.id}', '${testCaptainRavi.id}', '${testCaptainKiran.id}');
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
        testCaptainKiran.id,
        testCaptainKiran.phone,
        testCaptainKiran.role,
        testCaptainKiran.name,
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
    if (app) await app.close();
  });

  async function createTestBooking(riderId: string = testRiderAlice.id): Promise<{
    bookingId: string;
    bookingCode: string;
    startOtp: string;
  }> {
    // 1. Generate Quote
    const quoteRes = await request(app.getHttpServer())
      .post('/v1/quotes/authoritative')
      .set('x-actor-user-id', riderId)
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

    const quoteId = quoteRes.body.quoteId;
    const quoteToken = quoteRes.body.quoteToken;

    // 2. Book Ride
    const bookingRes = await request(app.getHttpServer())
      .post('/v1/bookings')
      .set('x-actor-user-id', riderId)
      .send({
        quoteId,
        quoteToken,
        idempotencyKey: `idemp-ev038-${Date.now()}-${Math.random()}`,
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.745,
        dropoffLongitude: 83.342,
        serviceCategory: 'CITY_COMMUTE_2W',
        passengerCount: 1,
      })
      .expect(201);

    return {
      bookingId: bookingRes.body.bookingId,
      bookingCode: bookingRes.body.bookingCode,
      startOtp: bookingRes.body.startOtp,
    };
  }

  describe('Complete Ride Lifecycle (EV-038 E2E)', () => {
    it('should execute full state machine: REQUESTED -> DISPATCHING -> ASSIGNED -> ARRIVED -> IN_PROGRESS -> COMPLETED', async () => {
      const { bookingId, startOtp } = await createTestBooking();

      // Verify initial creation recorded in ride_state_events
      const initialEvents = await dataSource.query(
        `SELECT * FROM "ride_state_events" WHERE "booking_id" = $1 ORDER BY "created_at" ASC`,
        [bookingId],
      );
      expect(initialEvents.length).toBeGreaterThanOrEqual(1);
      expect(initialEvents[0].to_status).toBe(RideStatus.REQUESTED);

      // Step 1: Rider requests dispatch -> DISPATCHING
      const dispatchRes = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/dispatch`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .expect(200);

      expect(dispatchRes.body.previousStatus).toBe('CREATED');
      expect(dispatchRes.body.currentStatus).toBe(RideStatus.DISPATCHING);
      expect(dispatchRes.body.timestamps.dispatchingAt).toBeDefined();

      // Step 2: Captain accepts dispatch -> ASSIGNED
      const assignRes = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/assign`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({
          captainId: testCaptainRavi.id,
          vehicleId: testVehicleA.id,
        })
        .expect(200);

      expect(assignRes.body.previousStatus).toBe(RideStatus.DISPATCHING);
      expect(assignRes.body.currentStatus).toBe(RideStatus.ASSIGNED);
      expect(assignRes.body.captainId).toBe(testCaptainRavi.id);
      expect(assignRes.body.vehicleId).toBe(testVehicleA.id);

      // Step 3: Captain arrives at pickup -> ARRIVED
      const arriveRes = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/arrive`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .expect(200);

      expect(arriveRes.body.previousStatus).toBe(RideStatus.ASSIGNED);
      expect(arriveRes.body.currentStatus).toBe(RideStatus.ARRIVED);
      expect(arriveRes.body.timestamps.arrivedAt).toBeDefined();

      // Step 4: Captain starts trip with valid OTP -> IN_PROGRESS
      const startRes = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/start`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ startOtp })
        .expect(200);

      expect(startRes.body.previousStatus).toBe(RideStatus.ARRIVED);
      expect(startRes.body.currentStatus).toBe(RideStatus.IN_PROGRESS);
      expect(startRes.body.timestamps.tripStartedAt).toBeDefined();

      // Step 5: Captain completes trip at destination -> COMPLETED
      const completeRes = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/complete`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .expect(200);

      expect(completeRes.body.previousStatus).toBe(RideStatus.IN_PROGRESS);
      expect(completeRes.body.currentStatus).toBe(RideStatus.COMPLETED);
      expect(completeRes.body.timestamps.tripCompletedAt).toBeDefined();

      // Verify database Booking row
      const bookingDb = await dataSource.query(`SELECT * FROM "bookings" WHERE "id" = $1`, [
        bookingId,
      ]);
      expect(bookingDb[0].status).toBe(RideStatus.COMPLETED);
      expect(bookingDb[0].captain_id).toBe(testCaptainRavi.id);
      expect(bookingDb[0].vehicle_id).toBe(testVehicleA.id);
      expect(bookingDb[0].trip_completed_at).not.toBeNull();
    });
  });

  describe('PostgreSQL Immutability Trigger Enforcement', () => {
    it('should strictly abort direct UPDATE queries on ride_state_events via database trigger', async () => {
      const { bookingId } = await createTestBooking();

      // Fetch the created event ID
      const events = await dataSource.query(
        `SELECT id FROM "ride_state_events" WHERE "booking_id" = $1 LIMIT 1`,
        [bookingId],
      );
      expect(events.length).toBe(1);
      const eventId = events[0].id;

      // Attempt direct SQL UPDATE on the immutable audit event
      await expect(
        dataSource.query(
          `UPDATE "ride_state_events" SET "to_status" = 'TAMPERED' WHERE "id" = $1`,
          [eventId],
        ),
      ).rejects.toThrow(
        /Updates and deletions on immutable ride_state_events are strictly prohibited/i,
      );
    });

    it('should strictly abort direct DELETE queries on ride_state_events via database trigger', async () => {
      const { bookingId } = await createTestBooking();

      const events = await dataSource.query(
        `SELECT id FROM "ride_state_events" WHERE "booking_id" = $1 LIMIT 1`,
        [bookingId],
      );
      const eventId = events[0].id;

      // Attempt direct SQL DELETE on the immutable audit event
      await expect(
        dataSource.query(`DELETE FROM "ride_state_events" WHERE "id" = $1`, [eventId]),
      ).rejects.toThrow(
        /Updates and deletions on immutable ride_state_events are strictly prohibited/i,
      );
    });
  });

  describe('Authorization & Error Safeguards E2E', () => {
    it('should reject unassigned captain from arriving on another captain ride with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      const { bookingId } = await createTestBooking();

      // Dispatch and assign to Captain Ravi
      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/dispatch`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/assign`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ captainId: testCaptainRavi.id, vehicleId: testVehicleA.id })
        .expect(200);

      // Captain Kiran attempts arrive on Captain Ravi's booking
      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/arrive`)
        .set('x-actor-user-id', testCaptainKiran.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .expect(403);

      expect(res.body.error?.code).toBe(ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR);
    });

    it('should reject captain starting ride with invalid OTP with 400 INVALID_START_OTP', async () => {
      const { bookingId } = await createTestBooking();

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/dispatch`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/assign`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ captainId: testCaptainRavi.id, vehicleId: testVehicleA.id })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/arrive`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .expect(200);

      // Captain attempts start with incorrect OTP '9999'
      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/start`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ startOtp: '9999' })
        .expect(400);

      expect(res.body.error?.code).toBe(ApiErrorCode.INVALID_START_OTP);
    });

    it('should reject rider attempt to cancel IN_PROGRESS trip with 403 UNAUTHORIZED_RIDE_ACTOR', async () => {
      const { bookingId, startOtp } = await createTestBooking();

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/dispatch`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/assign`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ captainId: testCaptainRavi.id, vehicleId: testVehicleA.id })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/arrive`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/start`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ startOtp })
        .expect(200);

      // Rider attempts unilateral cancellation during active trip
      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/cancel`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .send({ reason: 'Cancel on highway' })
        .expect(403);

      expect(res.body.error?.code).toBe(ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR);
    });

    it('should reject illegal status jump with 400 ILLEGAL_STATUS_TRANSITION', async () => {
      const { bookingId } = await createTestBooking();

      // Attempt to jump directly from REQUESTED to IN_PROGRESS
      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/transition`)
        .set('x-actor-role', RideActorRole.ADMIN)
        .send({ targetStatus: RideStatus.IN_PROGRESS })
        .expect(400);

      expect(res.body.error?.code).toBe(ApiErrorCode.ILLEGAL_STATUS_TRANSITION);
    });

    it('should reject further transitions on COMPLETED ride with 409 RIDE_ALREADY_TERMINATED', async () => {
      const { bookingId, startOtp } = await createTestBooking();

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/dispatch`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/assign`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ captainId: testCaptainRavi.id, vehicleId: testVehicleA.id })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/arrive`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/start`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .send({ startOtp })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/complete`)
        .set('x-actor-user-id', testCaptainRavi.id)
        .set('x-actor-role', RideActorRole.CAPTAIN)
        .expect(200);

      // Attempting to transition after trip is COMPLETED
      const res = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/transition`)
        .set('x-actor-role', RideActorRole.ADMIN)
        .send({ targetStatus: RideStatus.IN_PROGRESS })
        .expect(409);

      expect(res.body.error?.code).toBe(ApiErrorCode.RIDE_ALREADY_TERMINATED);
    });
  });

  describe('Audit Event Timeline E2E', () => {
    it('should return complete chronological events via GET /v1/bookings/:id/events', async () => {
      const { bookingId } = await createTestBooking();

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/dispatch`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .expect(200);

      const eventsRes = await request(app.getHttpServer())
        .get(`/v1/bookings/${bookingId}/events`)
        .set('x-actor-user-id', testRiderAlice.id)
        .set('x-actor-role', RideActorRole.RIDER)
        .expect(200);

      expect(eventsRes.body.bookingId).toBe(bookingId);
      expect(eventsRes.body.events.length).toBeGreaterThanOrEqual(2);
      expect(eventsRes.body.events[0].toStatus).toBe(RideStatus.REQUESTED);
      expect(eventsRes.body.events[1].toStatus).toBe(RideStatus.DISPATCHING);
    });
  });
});
