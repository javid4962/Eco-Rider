import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverComplianceAndDutyStatus1700000000010 implements MigrationInterface {
  name = 'AddDriverComplianceAndDutyStatus1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new compliance and duty columns to driver_profiles
    await queryRunner.query(`
      ALTER TABLE "driver_profiles"
        ADD COLUMN IF NOT EXISTS "license_expiry_date" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "duty_status" VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
        ADD COLUMN IF NOT EXISTS "duty_last_toggled_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "suspension_reason" TEXT,
        ADD COLUMN IF NOT EXISTS "compliance_notes" TEXT;
    `);

    // 2. Create index on duty_status
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_driver_profiles_duty_status"
        ON "driver_profiles" ("duty_status");
    `);

    // 3. Add check constraints for compliance lifecycle and duty states
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_driver_profiles_compliance_status'
        ) THEN
          ALTER TABLE "driver_profiles"
            ADD CONSTRAINT "chk_driver_profiles_compliance_status"
            CHECK ("verification_status" IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'EXPIRED'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_driver_profiles_duty_status'
        ) THEN
          ALTER TABLE "driver_profiles"
            ADD CONSTRAINT "chk_driver_profiles_duty_status"
            CHECK ("duty_status" IN ('ONLINE', 'OFFLINE', 'ON_TRIP'));
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop check constraints
    await queryRunner.query(`
      ALTER TABLE "driver_profiles"
        DROP CONSTRAINT IF EXISTS "chk_driver_profiles_duty_status",
        DROP CONSTRAINT IF EXISTS "chk_driver_profiles_compliance_status";
    `);

    // 2. Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_driver_profiles_duty_status";
    `);

    // 3. Drop columns
    await queryRunner.query(`
      ALTER TABLE "driver_profiles"
        DROP COLUMN IF EXISTS "compliance_notes",
        DROP COLUMN IF EXISTS "suspension_reason",
        DROP COLUMN IF EXISTS "duty_last_toggled_at",
        DROP COLUMN IF EXISTS "duty_status",
        DROP COLUMN IF EXISTS "license_expiry_date";
    `);
  }
}
