import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCaptainAvailabilityAndLocationFreshness1700000000019 implements MigrationInterface {
  name = 'AddCaptainAvailabilityAndLocationFreshness1700000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Expand driver_profiles table with availability states and live telemetry
    await queryRunner.query(`
      ALTER TABLE "driver_profiles"
        ADD COLUMN IF NOT EXISTS "availability_status" VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
        ADD COLUMN IF NOT EXISTS "current_latitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "current_longitude" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "current_location" GEOMETRY(Point, 4326),
        ADD COLUMN IF NOT EXISTS "location_accuracy_meters" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "location_heading_degrees" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "location_speed_kmph" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "location_altitude_meters" DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS "location_updated_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "battery_soc_percent" NUMERIC(5, 2),
        ADD COLUMN IF NOT EXISTS "status_reason" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "last_status_changed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // 2. Add check constraint for the 6 availability lifecycle states
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_driver_profiles_availability_status'
        ) THEN
          ALTER TABLE "driver_profiles"
            ADD CONSTRAINT "chk_driver_profiles_availability_status"
            CHECK ("availability_status" IN ('OFFLINE', 'AVAILABLE', 'RESERVED', 'ON_TRIP', 'CHARGING', 'MAINTENANCE'));
        END IF;
      END $$;
    `);

    // 3. Create spatial and query indexes on driver_profiles
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_driver_profiles_availability_status"
        ON "driver_profiles" ("availability_status");
      CREATE INDEX IF NOT EXISTS "idx_driver_profiles_location_gist"
        ON "driver_profiles" USING GIST ("current_location");
      CREATE INDEX IF NOT EXISTS "idx_driver_profiles_location_updated"
        ON "driver_profiles" ("location_updated_at");
    `);

    // 4. Create captain_location_pings table for high-frequency telemetry history
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_location_pings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "driver_profile_id" UUID NOT NULL REFERENCES "driver_profiles"("id") ON DELETE CASCADE,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "location" GEOMETRY(Point, 4326) NOT NULL,
        "accuracy_meters" DOUBLE PRECISION NOT NULL,
        "heading_degrees" DOUBLE PRECISION,
        "speed_kmph" DOUBLE PRECISION,
        "altitude_meters" DOUBLE PRECISION,
        "battery_soc_percent" NUMERIC(5, 2),
        "availability_status" VARCHAR(30) NOT NULL,
        "is_fresh" BOOLEAN NOT NULL DEFAULT TRUE,
        "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_captain_pings_driver_time"
        ON "captain_location_pings" ("driver_profile_id", "recorded_at" DESC);
      CREATE INDEX IF NOT EXISTS "idx_captain_pings_location_gist"
        ON "captain_location_pings" USING GIST ("location");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "captain_location_pings" CASCADE;`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_driver_profiles_location_updated";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_driver_profiles_location_gist";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_driver_profiles_availability_status";`);
    await queryRunner.query(`
      ALTER TABLE "driver_profiles"
        DROP CONSTRAINT IF EXISTS "chk_driver_profiles_availability_status";
    `);
    await queryRunner.query(`
      ALTER TABLE "driver_profiles"
        DROP COLUMN IF EXISTS "last_status_changed_at",
        DROP COLUMN IF EXISTS "status_reason",
        DROP COLUMN IF EXISTS "battery_soc_percent",
        DROP COLUMN IF EXISTS "location_updated_at",
        DROP COLUMN IF EXISTS "location_altitude_meters",
        DROP COLUMN IF EXISTS "location_speed_kmph",
        DROP COLUMN IF EXISTS "location_heading_degrees",
        DROP COLUMN IF EXISTS "location_accuracy_meters",
        DROP COLUMN IF EXISTS "current_location",
        DROP COLUMN IF EXISTS "current_longitude",
        DROP COLUMN IF EXISTS "current_latitude",
        DROP COLUMN IF EXISTS "availability_status";
    `);
  }
}
