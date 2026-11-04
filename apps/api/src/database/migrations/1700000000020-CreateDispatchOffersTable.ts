import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDispatchOffersTable1700000000020 implements MigrationInterface {
  name = 'CreateDispatchOffersTable1700000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dispatch_offers" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
        "captain_id" UUID NOT NULL REFERENCES "driver_profiles"("id") ON DELETE RESTRICT,
        "vehicle_id" UUID NOT NULL REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        "offer_sequence" INT NOT NULL DEFAULT 1,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "offered_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "responded_at" TIMESTAMPTZ,
        "decline_reason" VARCHAR(100),
        "timeout_job_id" VARCHAR(255),
        "offer_timeout_seconds" INT NOT NULL DEFAULT 15,
        "estimated_pickup_distance_meters" INT NOT NULL DEFAULT 0,
        "estimated_pickup_duration_seconds" INT NOT NULL DEFAULT 0,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_dispatch_offers_status'
        ) THEN
          ALTER TABLE "dispatch_offers"
            ADD CONSTRAINT "chk_dispatch_offers_status"
            CHECK ("status" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'TIMED_OUT', 'SUPERSEDED', 'CANCELLED'));
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dispatch_offers_booking_id"
        ON "dispatch_offers" ("booking_id");
      CREATE INDEX IF NOT EXISTS "idx_dispatch_offers_booking_seq"
        ON "dispatch_offers" ("booking_id", "offer_sequence");
      CREATE INDEX IF NOT EXISTS "idx_dispatch_offers_captain_status"
        ON "dispatch_offers" ("captain_id", "status");
      CREATE INDEX IF NOT EXISTS "idx_dispatch_offers_status_expires"
        ON "dispatch_offers" ("status", "expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "dispatch_offers" CASCADE;`);
  }
}

