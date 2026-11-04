import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDispatchOutboxEventsTable1700000000021 implements MigrationInterface {
  name = 'CreateDispatchOutboxEventsTable1700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dispatch_outbox_events" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "aggregate_type" VARCHAR(50) NOT NULL,
        "aggregate_id" UUID NOT NULL,
        "event_type" VARCHAR(50) NOT NULL,
        "payload" JSONB NOT NULL,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "retry_count" INT NOT NULL DEFAULT 0,
        "error_message" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "processed_at" TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_dispatch_outbox_events_status'
        ) THEN
          ALTER TABLE "dispatch_outbox_events"
            ADD CONSTRAINT "chk_dispatch_outbox_events_status"
            CHECK ("status" IN ('PENDING', 'PUBLISHED', 'FAILED'));
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dispatch_outbox_events_aggregate"
        ON "dispatch_outbox_events" ("aggregate_type", "aggregate_id");
      CREATE INDEX IF NOT EXISTS "idx_dispatch_outbox_events_status_created"
        ON "dispatch_outbox_events" ("status", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "dispatch_outbox_events" CASCADE;`);
  }
}
