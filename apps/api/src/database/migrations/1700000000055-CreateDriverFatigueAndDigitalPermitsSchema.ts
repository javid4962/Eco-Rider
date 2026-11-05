import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDriverFatigueAndDigitalPermitsSchema1700000000055 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "driver_fatigue_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" character varying(64) NOT NULL,
        "vehicle_id" character varying(64) NOT NULL,
        "perclos_percent" numeric(5,2) NOT NULL,
        "yawn_count" integer NOT NULL DEFAULT 0,
        "micro_sleep_detected" boolean NOT NULL DEFAULT false,
        "composite_fatigue_score" integer NOT NULL,
        "severity" character varying(32) NOT NULL,
        "haptic_alert_triggered" boolean NOT NULL DEFAULT false,
        "mandatory_rest_required" boolean NOT NULL DEFAULT false,
        "rest_duration_minutes" integer NOT NULL DEFAULT 0,
        "dispatch_blocked_until" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_driver_fatigue_events_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "digital_permit_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "permit_number" character varying(64) NOT NULL,
        "vehicle_id" character varying(64) NOT NULL,
        "registration_number" character varying(32) NOT NULL,
        "permit_type" character varying(64) NOT NULL,
        "rto_office_code" character varying(32) NOT NULL,
        "valid_from" TIMESTAMP WITH TIME ZONE NOT NULL,
        "valid_until" TIMESTAMP WITH TIME ZONE NOT NULL,
        "puc_exempt" boolean NOT NULL DEFAULT true,
        "road_tax_exempt" boolean NOT NULL DEFAULT true,
        "status" character varying(32) NOT NULL DEFAULT 'COMPLIANT',
        "verification_hash" character varying(128) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_digital_permit_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_digital_permit_records_num" UNIQUE ("permit_number")
      );

      CREATE INDEX IF NOT EXISTS "idx_fatigue_captain" ON "driver_fatigue_events" ("captain_id");
      CREATE INDEX IF NOT EXISTS "idx_permit_vehicle" ON "digital_permit_records" ("vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "digital_permit_records";
      DROP TABLE IF EXISTS "driver_fatigue_events";
    `);
  }
}
