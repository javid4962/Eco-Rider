import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayoutBatchesAndItemsSchema1700000000024 implements MigrationInterface {
  name = 'CreatePayoutBatchesAndItemsSchema1700000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create payout_batches table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payout_batches" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "batch_number" VARCHAR(50) NOT NULL UNIQUE,
        "status" VARCHAR(50) NOT NULL DEFAULT 'PROPOSED',
        "total_disbursal_paise" BIGINT NOT NULL DEFAULT 0,
        "total_items_count" INT NOT NULL DEFAULT 0,
        "period_start" TIMESTAMPTZ NOT NULL,
        "period_end" TIMESTAMPTZ NOT NULL,
        "approved_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "approved_at" TIMESTAMPTZ,
        "notes" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payout_batches_number" ON "payout_batches"("batch_number");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payout_batches_status" ON "payout_batches"("status");`,
    );

    // 2. Create payout_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payout_items" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "batch_id" UUID NOT NULL REFERENCES "payout_batches"("id") ON DELETE CASCADE,
        "recipient_type" VARCHAR(50) NOT NULL DEFAULT 'CAPTAIN',
        "recipient_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "payout_account_id" VARCHAR(100) NOT NULL,
        "gross_earnings_paise" BIGINT NOT NULL,
        "cash_collected_offset_paise" BIGINT NOT NULL DEFAULT 0,
        "net_disbursal_paise" BIGINT NOT NULL,
        "escrow_reserve_paise" BIGINT NOT NULL DEFAULT 0,
        "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        "gateway_payout_id" VARCHAR(100),
        "idempotency_key" VARCHAR(100) NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payout_items_batch" ON "payout_items"("batch_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payout_items_recipient" ON "payout_items"("recipient_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payout_items_status" ON "payout_items"("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payout_items_idempotency" ON "payout_items"("idempotency_key");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payout_items" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payout_batches" CASCADE;`);
  }
}

