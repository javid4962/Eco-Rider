import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1700000000001 implements MigrationInterface {
  name = 'CreateInitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "phone" VARCHAR(20) NOT NULL UNIQUE,
        "role" VARCHAR(30) NOT NULL,
        "name" VARCHAR(100),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_phone" ON "users" ("phone");`);

    // 2. Vehicles table with 100% Battery Electric constraint
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "registration_number" VARCHAR(30) NOT NULL UNIQUE,
        "propulsion_type" VARCHAR(30) NOT NULL,
        "battery_capacity_kwh" NUMERIC(6,2) NOT NULL,
        "current_soc_percent" NUMERIC(5,2) NOT NULL DEFAULT 100.00,
        "vehicle_category" VARCHAR(50) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "chk_vehicles_electric_only" CHECK ("propulsion_type" = 'BATTERY_ELECTRIC'),
        CONSTRAINT "chk_vehicles_soc_range" CHECK ("current_soc_percent" >= 0.00 AND "current_soc_percent" <= 100.00)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_vehicles_registration" ON "vehicles" ("registration_number");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_vehicles_category" ON "vehicles" ("vehicle_category");`,
    );

    // 3. Zones table with PostGIS geometry Polygon
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zones" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "city" VARCHAR(50) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "boundary" geometry(Polygon, 4326) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_zones_city" ON "zones" ("city");`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zones_boundary_gist" ON "zones" USING GIST ("boundary");`,
    );

    // 4. Bookings table with PostGIS Point geometries
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bookings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_code" VARCHAR(30) NOT NULL UNIQUE,
        "rider_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "captain_id" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
        "vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        "service_category" VARCHAR(50) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "pickup_location" geometry(Point, 4326) NOT NULL,
        "dropoff_location" geometry(Point, 4326) NOT NULL,
        "start_otp" VARCHAR(4),
        "fare_amount" NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bookings_rider_status" ON "bookings" ("rider_id", "status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bookings_captain_status" ON "bookings" ("captain_id", "status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bookings_pickup_gist" ON "bookings" USING GIST ("pickup_location");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_bookings_dropoff_gist" ON "bookings" USING GIST ("dropoff_location");`,
    );

    // 5. Ledger entries table (double-entry immutable ledger)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ledger_entries" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "idempotency_key" VARCHAR(100) NOT NULL UNIQUE,
        "booking_id" UUID REFERENCES "bookings"("id") ON DELETE RESTRICT,
        "account_id" VARCHAR(100) NOT NULL,
        "entry_type" VARCHAR(20) NOT NULL,
        "amount_paise" BIGINT NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
        "description" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "chk_ledger_entry_type" CHECK ("entry_type" IN ('DEBIT', 'CREDIT')),
        CONSTRAINT "chk_ledger_amount_positive" CHECK ("amount_paise" > 0)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ledger_booking_account" ON "ledger_entries" ("booking_id", "account_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_ledger_idempotency" ON "ledger_entries" ("idempotency_key");`,
    );

    // 6. Audit logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id" UUID NOT NULL,
        "actor_id" UUID,
        "action" VARCHAR(100) NOT NULL,
        "previous_state" JSONB,
        "new_state" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_created" ON "audit_logs" ("created_at" DESC);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ledger_entries" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "zones" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
  }
}
