import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandVehiclesTableWithEVCompliance1700000000008 implements MigrationInterface {
  name = 'ExpandVehiclesTableWithEVCompliance1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "make" VARCHAR(100) NOT NULL DEFAULT 'Ather Energy',
        ADD COLUMN IF NOT EXISTS "model" VARCHAR(100) NOT NULL DEFAULT '450X',
        ADD COLUMN IF NOT EXISTS "year_of_manufacture" INT NOT NULL DEFAULT 2024,
        ADD COLUMN IF NOT EXISTS "approved_passenger_seating" INT NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "rated_range_km" INT NOT NULL DEFAULT 110,
        ADD COLUMN IF NOT EXISTS "range_telemetry_source" VARCHAR(50) NOT NULL DEFAULT 'OBD_TELEMATICS',
        ADD COLUMN IF NOT EXISTS "telemetry_device_id" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "telemetry_last_ping_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "owner_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "insurance_policy_number" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "insurance_expiry_date" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "fitness_certificate_number" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "fitness_expiry_date" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "commercial_permit_number" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "commercial_permit_expiry" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "green_plate_verified" BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "verification_status" VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
        ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
        ADD COLUMN IF NOT EXISTS "city" VARCHAR(50) NOT NULL DEFAULT 'visakhapatnam';
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_seating_positive'
        ) THEN
          ALTER TABLE "vehicles"
            ADD CONSTRAINT "chk_vehicles_seating_positive"
            CHECK ("approved_passenger_seating" >= 1 AND "approved_passenger_seating" <= 10);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_rated_range_positive'
        ) THEN
          ALTER TABLE "vehicles"
            ADD CONSTRAINT "chk_vehicles_rated_range_positive"
            CHECK ("rated_range_km" > 0);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vehicles_owner_id" ON "vehicles" ("owner_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vehicles_verification_status" ON "vehicles" ("verification_status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vehicles_city" ON "vehicles" ("city");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_city";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_verification_status";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_owner_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
        DROP CONSTRAINT IF EXISTS "chk_vehicles_rated_range_positive",
        DROP CONSTRAINT IF EXISTS "chk_vehicles_seating_positive",
        DROP COLUMN IF EXISTS "city",
        DROP COLUMN IF EXISTS "rejection_reason",
        DROP COLUMN IF EXISTS "verification_status",
        DROP COLUMN IF EXISTS "green_plate_verified",
        DROP COLUMN IF EXISTS "commercial_permit_expiry",
        DROP COLUMN IF EXISTS "commercial_permit_number",
        DROP COLUMN IF EXISTS "fitness_expiry_date",
        DROP COLUMN IF EXISTS "fitness_certificate_number",
        DROP COLUMN IF EXISTS "insurance_expiry_date",
        DROP COLUMN IF EXISTS "insurance_policy_number",
        DROP COLUMN IF EXISTS "owner_id",
        DROP COLUMN IF EXISTS "telemetry_last_ping_at",
        DROP COLUMN IF EXISTS "telemetry_device_id",
        DROP COLUMN IF EXISTS "range_telemetry_source",
        DROP COLUMN IF EXISTS "rated_range_km",
        DROP COLUMN IF EXISTS "approved_passenger_seating",
        DROP COLUMN IF EXISTS "year_of_manufacture",
        DROP COLUMN IF EXISTS "model",
        DROP COLUMN IF EXISTS "make";
    `);
  }
}

