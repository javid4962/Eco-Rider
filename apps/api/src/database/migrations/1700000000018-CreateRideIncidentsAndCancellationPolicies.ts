import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRideIncidentsAndCancellationPolicies1700000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Expand bookings table with cancellation_fee_paise
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "cancellation_fee_paise" BIGINT NOT NULL DEFAULT 0;
    `);

    // 2. Concurrency-safe unique index for idempotency_key on bookings
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_bookings_idempotency_unique"
        ON "bookings" ("idempotency_key")
        WHERE "idempotency_key" IS NOT NULL;
    `);

    // 3. Create ride_incidents table for safety/operational incident tracking
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ride_incidents" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE RESTRICT,
        "incident_code" VARCHAR(50) NOT NULL UNIQUE,
        "incident_type" VARCHAR(50) NOT NULL,
        "severity" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        "status" VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
        "reported_by_id" UUID NOT NULL,
        "reported_by_role" VARCHAR(50) NOT NULL,
        "description" TEXT NOT NULL,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ride_incidents_booking_id"
        ON "ride_incidents" ("booking_id");
      CREATE INDEX IF NOT EXISTS "idx_ride_incidents_status"
        ON "ride_incidents" ("status");
      CREATE INDEX IF NOT EXISTS "idx_ride_incidents_code"
        ON "ride_incidents" ("incident_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ride_incidents" CASCADE;`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bookings_idempotency_unique";`);
    await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "cancellation_fee_paise";
    `);
  }
}
