import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrivacyAndDataDeletionWorkflows1700000000006 implements MigrationInterface {
  name = 'CreatePrivacyAndDataDeletionWorkflows1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Data Deletion Requests Table (DPDP / Statutory Retention Tracking)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "data_deletion_requests" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" VARCHAR(30) NOT NULL CHECK ("status" IN ('PENDING', 'COMPLETED', 'REJECTED')),
        "reason" TEXT,
        "rejection_reason" TEXT,
        "erased_items" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "mandatory_retention_exceptions" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "ip_address" VARCHAR(45),
        "user_agent" VARCHAR(255),
        "processed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_deletion_requests_user_id" ON "data_deletion_requests" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_deletion_requests_status" ON "data_deletion_requests" ("status");
    `);

    // 2. Optimization index on consents for quick active consent evaluation
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consents_user_type_granted" ON "consents" ("user_id", "consent_type", "is_granted");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_consents_user_type_granted";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_deletion_requests_status";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_deletion_requests_user_id";
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "data_deletion_requests" CASCADE;
    `);
  }
}
