import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceCitiesAndExpandServiceZones1700000000014 implements MigrationInterface {
  name = 'CreateServiceCitiesAndExpandServiceZones1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create service_cities table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_cities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "name" VARCHAR(100) NOT NULL,
        "state" VARCHAR(50) NOT NULL DEFAULT 'Andhra Pradesh',
        "operational_status" VARCHAR(30) NOT NULL DEFAULT 'DISABLED',
        "evidence_reference" VARCHAR(150),
        "permit_expires_at" TIMESTAMPTZ,
        "category_switches" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "center_latitude" NUMERIC(10, 6) NOT NULL DEFAULT 17.6868,
        "center_longitude" NUMERIC(10, 6) NOT NULL DEFAULT 83.2185,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chk_service_cities_status"
          CHECK ("operational_status" IN ('ACTIVE', 'PILOT', 'INACTIVE', 'SUSPENDED', 'DISABLED'))
      );

      CREATE INDEX IF NOT EXISTS "idx_service_cities_code" ON "service_cities" ("code");
      CREATE INDEX IF NOT EXISTS "idx_service_cities_status" ON "service_cities" ("operational_status");
    `);

    // 2. Expand zones table with operational fields, evidence reference, permit expiry and category switches
    await queryRunner.query(`
      ALTER TABLE "zones"
        ADD COLUMN IF NOT EXISTS "code" VARCHAR(50) UNIQUE,
        ADD COLUMN IF NOT EXISTS "operational_status" VARCHAR(30) NOT NULL DEFAULT 'DISABLED',
        ADD COLUMN IF NOT EXISTS "evidence_reference" VARCHAR(150),
        ADD COLUMN IF NOT EXISTS "permit_expires_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "category_switches" JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS "center_latitude" NUMERIC(10, 6),
        ADD COLUMN IF NOT EXISTS "center_longitude" NUMERIC(10, 6);

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_zones_operational_status'
        ) THEN
          ALTER TABLE "zones"
            ADD CONSTRAINT "chk_zones_operational_status"
            CHECK ("operational_status" IN ('ACTIVE', 'PILOT', 'INACTIVE', 'SUSPENDED', 'DISABLED'));
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS "idx_zones_code" ON "zones" ("code");
      CREATE INDEX IF NOT EXISTS "idx_zones_operational_status" ON "zones" ("operational_status");
      CREATE INDEX IF NOT EXISTS "idx_zones_permit_expiry" ON "zones" ("permit_expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_zones_permit_expiry";
      DROP INDEX IF EXISTS "idx_zones_operational_status";
      DROP INDEX IF EXISTS "idx_zones_code";

      ALTER TABLE "zones"
        DROP CONSTRAINT IF EXISTS "chk_zones_operational_status",
        DROP COLUMN IF EXISTS "center_longitude",
        DROP COLUMN IF EXISTS "center_latitude",
        DROP COLUMN IF EXISTS "category_switches",
        DROP COLUMN IF EXISTS "permit_expires_at",
        DROP COLUMN IF EXISTS "evidence_reference",
        DROP COLUMN IF EXISTS "operational_status",
        DROP COLUMN IF EXISTS "code";

      DROP TABLE IF EXISTS "service_cities" CASCADE;
    `);
  }
}
