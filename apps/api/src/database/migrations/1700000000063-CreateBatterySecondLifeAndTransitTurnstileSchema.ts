import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBatterySecondLifeAndTransitTurnstileSchema1700000000063 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "battery_second_life_assessments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "battery_serial" character varying(120) NOT NULL,
        "original_vehicle_id" character varying(120) NOT NULL,
        "original_capacity_kwh" numeric(6,2) NOT NULL,
        "measured_capacity_kwh" numeric(6,2) NOT NULL,
        "state_of_health_percent" numeric(5,2) NOT NULL,
        "resistance_ratio" numeric(5,2) NOT NULL,
        "health_grade" character varying(64) NOT NULL,
        "assigned_duty" character varying(64) NOT NULL,
        "is_eligible_for_second_life" boolean NOT NULL DEFAULT true,
        "recommended_max_crate" numeric(4,2) NOT NULL DEFAULT 0.50,
        "cycle_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_battery_second_life_assessments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_battery_second_life_serial" UNIQUE ("battery_serial")
      );

      CREATE TABLE IF NOT EXISTS "transit_turnstile_accesses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token_hash" character varying(128) NOT NULL,
        "booking_id" character varying(120) NOT NULL,
        "rider_id" character varying(120) NOT NULL,
        "station_code" character varying(64) NOT NULL,
        "turnstile_id" character varying(120),
        "gate_status" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "scanned_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transit_turnstile_accesses_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transit_turnstile_token_hash" UNIQUE ("token_hash")
      );

      CREATE INDEX IF NOT EXISTS "idx_battery_second_life_serial" ON "battery_second_life_assessments" ("battery_serial");
      CREATE INDEX IF NOT EXISTS "idx_transit_turnstile_token" ON "transit_turnstile_accesses" ("token_hash");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "transit_turnstile_accesses";
      DROP TABLE IF EXISTS "battery_second_life_assessments";
    `);
  }
}
