import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCorridorSchedulesAndSeatReservationsSchema1700000000025 implements MigrationInterface {
  name = 'CreateCorridorSchedulesAndSeatReservationsSchema1700000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create corridor_routes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corridor_routes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "name" VARCHAR(100) NOT NULL,
        "origin_city" VARCHAR(50) NOT NULL,
        "destination_city" VARCHAR(50) NOT NULL,
        "stops" JSONB NOT NULL,
        "total_distance_meters" INT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_routes_code" ON "corridor_routes"("code");`,
    );

    // 2. Create corridor_schedules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corridor_schedules" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "route_id" UUID NOT NULL REFERENCES "corridor_routes"("id") ON DELETE CASCADE,
        "departure_time" VARCHAR(10) NOT NULL,
        "days_of_week" INT[] NOT NULL,
        "total_seats" INT NOT NULL DEFAULT 7,
        "base_segment_fare_paise" BIGINT NOT NULL DEFAULT 2500,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_schedules_route" ON "corridor_schedules"("route_id");`,
    );

    // 3. Create corridor_trips table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corridor_trips" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "schedule_id" UUID NOT NULL REFERENCES "corridor_schedules"("id") ON DELETE CASCADE,
        "route_id" UUID NOT NULL REFERENCES "corridor_routes"("id") ON DELETE CASCADE,
        "trip_date" DATE NOT NULL,
        "departure_time" VARCHAR(10) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
        "total_seats" INT NOT NULL DEFAULT 7,
        "vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL,
        "captain_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_corridor_trips_schedule_date" UNIQUE ("schedule_id", "trip_date")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_trips_schedule" ON "corridor_trips"("schedule_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_trips_route" ON "corridor_trips"("route_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_trips_date" ON "corridor_trips"("trip_date");`,
    );

    // 4. Create corridor_seat_reservations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corridor_seat_reservations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "trip_id" UUID NOT NULL REFERENCES "corridor_trips"("id") ON DELETE CASCADE,
        "rider_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "booking_id" UUID REFERENCES "bookings"("id") ON DELETE SET NULL,
        "from_stop_sequence" INT NOT NULL,
        "from_stop_name" VARCHAR(100) NOT NULL,
        "to_stop_sequence" INT NOT NULL,
        "to_stop_name" VARCHAR(100) NOT NULL,
        "seat_number" INT NOT NULL,
        "boarding_pass_code" VARCHAR(20) NOT NULL UNIQUE,
        "fare_paise" BIGINT NOT NULL,
        "idempotency_key" VARCHAR(100) NOT NULL UNIQUE,
        "status" VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
        "checked_in" BOOLEAN NOT NULL DEFAULT false,
        "checked_in_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_reservations_trip" ON "corridor_seat_reservations"("trip_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_reservations_rider" ON "corridor_seat_reservations"("rider_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_reservations_pass_code" ON "corridor_seat_reservations"("boarding_pass_code");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corridor_reservations_idempotency" ON "corridor_seat_reservations"("idempotency_key");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "corridor_seat_reservations" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corridor_trips" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corridor_schedules" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corridor_routes" CASCADE;`);
  }
}

