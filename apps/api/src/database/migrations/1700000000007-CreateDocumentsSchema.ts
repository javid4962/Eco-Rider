import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentsSchema1700000000007 implements MigrationInterface {
  name = 'CreateDocumentsSchema1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "document_type" VARCHAR(50) NOT NULL,
        "original_filename" VARCHAR(255) NOT NULL,
        "storage_key" VARCHAR(255) NOT NULL UNIQUE,
        "mime_type" VARCHAR(100) NOT NULL,
        "file_size_bytes" INT NOT NULL,
        "sha256_checksum" VARCHAR(64) NOT NULL,
        "scan_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_SCAN',
        "scan_details" JSONB,
        "retention_policy" VARCHAR(50) NOT NULL DEFAULT 'KYC_STATUTORY_5_YEARS',
        "expires_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_documents_user_id" ON "documents" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_documents_storage_key" ON "documents" ("storage_key");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_documents_status" ON "documents" ("scan_status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_documents_expires_at" ON "documents" ("expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_documents_expires_at";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_documents_status";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_documents_storage_key";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_documents_user_id";
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "documents" CASCADE;
    `);
  }
}
