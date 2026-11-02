import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComplianceWarningsTable1700000000012 implements MigrationInterface {
  name = 'CreateComplianceWarningsTable1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compliance_warnings" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "driver_profile_id" UUID REFERENCES "driver_profiles"("id") ON DELETE SET NULL,
        "vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL,
        "target_type" VARCHAR(50) NOT NULL,
        "target_identifier" VARCHAR(100) NOT NULL,
        "expiry_date" TIMESTAMPTZ NOT NULL,
        "days_remaining" INT NOT NULL,
        "warning_tier" VARCHAR(30) NOT NULL,
        "is_resolved" BOOLEAN NOT NULL DEFAULT false,
        "resolved_at" TIMESTAMPTZ,
        "resolution_type" VARCHAR(50),
        "action_required" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chk_compliance_warnings_tier"
          CHECK ("warning_tier" IN ('WARNING_30D', 'WARNING_15D', 'WARNING_7D', 'WARNING_1D', 'EXPIRED')),
        CONSTRAINT "chk_compliance_warnings_target_type"
          CHECK ("target_type" IN ('DRIVER_LICENSE', 'VEHICLE_INSURANCE', 'VEHICLE_FITNESS', 'VEHICLE_PERMIT'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_compliance_warnings_user_id"
        ON "compliance_warnings" ("user_id");

      CREATE INDEX IF NOT EXISTS "idx_compliance_warnings_driver_id"
        ON "compliance_warnings" ("driver_profile_id");

      CREATE INDEX IF NOT EXISTS "idx_compliance_warnings_vehicle_id"
        ON "compliance_warnings" ("vehicle_id");

      CREATE INDEX IF NOT EXISTS "idx_compliance_warnings_tier"
        ON "compliance_warnings" ("warning_tier");

      CREATE INDEX IF NOT EXISTS "idx_compliance_warnings_resolved"
        ON "compliance_warnings" ("is_resolved");

      CREATE INDEX IF NOT EXISTS "idx_compliance_warnings_created_at"
        ON "compliance_warnings" ("created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "compliance_warnings";
    `);
  }
}
