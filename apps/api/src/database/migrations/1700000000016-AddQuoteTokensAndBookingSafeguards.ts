import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteTokensAndBookingSafeguards1700000000016 implements MigrationInterface {
  name = 'AddQuoteTokensAndBookingSafeguards1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Expand ride_quotes with cryptographic token, lifecycle status, consumption trace, and context pinning
    await queryRunner.query(`
      ALTER TABLE "ride_quotes"
        ADD COLUMN IF NOT EXISTS "quote_token" TEXT,
        ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS "consumed_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "booking_id" UUID REFERENCES "bookings"("id") ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "passenger_count" INT NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "vehicle_class" VARCHAR(50);

      CREATE INDEX IF NOT EXISTS "idx_ride_quotes_status"
        ON "ride_quotes" ("status");
      CREATE INDEX IF NOT EXISTS "idx_ride_quotes_idempotency"
        ON "ride_quotes" ("idempotency_key");
    `);

    // 2. Expand bookings table with idempotency_key and passenger_count
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "passenger_count" INT NOT NULL DEFAULT 1;

      CREATE INDEX IF NOT EXISTS "idx_bookings_idempotency"
        ON "bookings" ("idempotency_key");
      CREATE INDEX IF NOT EXISTS "idx_bookings_quote"
        ON "bookings" ("quote_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_bookings_quote";
      DROP INDEX IF EXISTS "idx_bookings_idempotency";
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "passenger_count",
        DROP COLUMN IF EXISTS "idempotency_key";

      DROP INDEX IF EXISTS "idx_ride_quotes_idempotency";
      DROP INDEX IF EXISTS "idx_ride_quotes_status";
      ALTER TABLE "ride_quotes"
        DROP COLUMN IF EXISTS "vehicle_class",
        DROP COLUMN IF EXISTS "passenger_count",
        DROP COLUMN IF EXISTS "idempotency_key",
        DROP COLUMN IF EXISTS "booking_id",
        DROP COLUMN IF EXISTS "consumed_at",
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "quote_token";
    `);
  }
}
