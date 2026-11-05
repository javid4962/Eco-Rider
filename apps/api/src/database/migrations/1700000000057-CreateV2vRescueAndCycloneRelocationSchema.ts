import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateV2vRescueAndCycloneRelocationSchema1700000000057 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "v2v_rescue_missions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rescue_vehicle_id" character varying(64) NOT NULL,
        "rescue_captain_id" character varying(64) NOT NULL,
        "stranded_vehicle_id" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'REQUESTED',
        "eta_minutes" integer NOT NULL DEFAULT 15,
        "start_soc_percent" numeric(4,1) NOT NULL,
        "target_kwh_required" numeric(5,2) NOT NULL,
        "transferred_kwh" numeric(5,2) NOT NULL DEFAULT 0,
        "base_dispatch_fee_paise" integer NOT NULL DEFAULT 35000,
        "energy_fee_paise" integer NOT NULL DEFAULT 0,
        "gst_paise" integer NOT NULL DEFAULT 0,
        "total_cost_paise" integer NOT NULL DEFAULT 0,
        "highway_or_corridor" character varying(128),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_v2v_rescue_missions_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "cyclone_relocation_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cyclone_name" character varying(64) NOT NULL,
        "alert_level" character varying(32) NOT NULL,
        "source_flood_zone" character varying(128) NOT NULL,
        "target_safe_staging_hub" character varying(128) NOT NULL,
        "total_vehicles_targeted" integer NOT NULL DEFAULT 0,
        "successfully_staged_count" integer NOT NULL DEFAULT 0,
        "relocation_status" character varying(32) NOT NULL DEFAULT 'PLAN_GENERATED',
        "elevation_delta_meters" numeric(5,1) NOT NULL DEFAULT 0,
        "instructions" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cyclone_relocation_plans_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_v2v_stranded_vehicle" ON "v2v_rescue_missions" ("stranded_vehicle_id");
      CREATE INDEX IF NOT EXISTS "idx_cyclone_alert_level" ON "cyclone_relocation_plans" ("alert_level");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "cyclone_relocation_plans";
      DROP TABLE IF EXISTS "v2v_rescue_missions";
    `);
  }
}
