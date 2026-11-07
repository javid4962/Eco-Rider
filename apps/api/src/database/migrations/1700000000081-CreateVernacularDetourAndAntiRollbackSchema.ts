import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVernacularDetourAndAntiRollbackSchema1700000000081 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vernacular_navigation_prompts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "prompt_text_telugu" text NOT NULL,
        "prompt_text_english" text NOT NULL,
        "suggested_facility_type" character varying(64) NOT NULL,
        "target_facility_id" character varying(120) NOT NULL,
        "target_facility_name" character varying(120) NOT NULL,
        "detour_distance_meters" integer NOT NULL,
        "audio_file_url" character varying(256) NOT NULL,
        "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vernacular_nav_prompts_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "anti_rollback_stall_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(120) NOT NULL,
        "flyover_name" character varying(120) NOT NULL,
        "rollback_detected" boolean NOT NULL DEFAULT false,
        "severity" character varying(64) NOT NULL,
        "holding_torque_boost_nm" numeric(6,2) NOT NULL,
        "hill_start_assist_active" boolean NOT NULL DEFAULT false,
        "alert_issued" boolean NOT NULL DEFAULT false,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_anti_rollback_stall_events_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_vernacular_prompts_captain" ON "vernacular_navigation_prompts" ("captain_id");
      CREATE INDEX IF NOT EXISTS "idx_anti_rollback_vehicle" ON "anti_rollback_stall_events" ("vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "anti_rollback_stall_events";
      DROP TABLE IF EXISTS "vernacular_navigation_prompts";
    `);
  }
}

