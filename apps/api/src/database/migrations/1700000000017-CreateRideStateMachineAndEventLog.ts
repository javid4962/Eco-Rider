import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRideStateMachineAndEventLog1700000000017 implements MigrationInterface {
  name = 'CreateRideStateMachineAndEventLog1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Expand bookings table with transition timestamps, cancellation details, and failure tracking
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "requested_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS "dispatching_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "assigned_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "arrived_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "trip_started_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "trip_completed_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "cancellation_reason" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "cancelled_by_role" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "cancelled_by_id" UUID,
        ADD COLUMN IF NOT EXISTS "failed_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "failure_reason" VARCHAR(255);

      CREATE INDEX IF NOT EXISTS "idx_bookings_status"
        ON "bookings" ("status");
      CREATE INDEX IF NOT EXISTS "idx_bookings_created_status"
        ON "bookings" ("created_at", "status");
    `);

    // 2. Create immutable ride_state_events table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ride_state_events" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
        "from_status" VARCHAR(50),
        "to_status" VARCHAR(50) NOT NULL,
        "actor_id" UUID NOT NULL,
        "actor_role" VARCHAR(50) NOT NULL,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "idx_ride_state_events_booking_created"
        ON "ride_state_events" ("booking_id", "created_at" ASC);
      CREATE INDEX IF NOT EXISTS "idx_ride_state_events_actor"
        ON "ride_state_events" ("actor_id", "actor_role");
      CREATE INDEX IF NOT EXISTS "idx_ride_state_events_to_status"
        ON "ride_state_events" ("to_status");
    `);

    // 3. Attach PostgreSQL trigger guaranteeing ride_state_events is append-only / immutable
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_ride_state_events_mutation()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'Updates and deletions on immutable ride_state_events are strictly prohibited.';
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_prevent_ride_state_events_mutation ON "ride_state_events";
      CREATE TRIGGER trg_prevent_ride_state_events_mutation
        BEFORE UPDATE OR DELETE ON "ride_state_events"
        FOR EACH ROW
        EXECUTE FUNCTION prevent_ride_state_events_mutation();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_prevent_ride_state_events_mutation ON "ride_state_events";
      DROP FUNCTION IF EXISTS prevent_ride_state_events_mutation();
      DROP TABLE IF EXISTS "ride_state_events";

      DROP INDEX IF EXISTS "idx_bookings_created_status";
      DROP INDEX IF EXISTS "idx_bookings_status";

      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "failure_reason",
        DROP COLUMN IF EXISTS "failed_at",
        DROP COLUMN IF EXISTS "cancelled_by_id",
        DROP COLUMN IF EXISTS "cancelled_by_role",
        DROP COLUMN IF EXISTS "cancellation_reason",
        DROP COLUMN IF EXISTS "cancelled_at",
        DROP COLUMN IF EXISTS "trip_completed_at",
        DROP COLUMN IF EXISTS "trip_started_at",
        DROP COLUMN IF EXISTS "arrived_at",
        DROP COLUMN IF EXISTS "assigned_at",
        DROP COLUMN IF EXISTS "dispatching_at",
        DROP COLUMN IF EXISTS "requested_at";
    `);
  }
}
