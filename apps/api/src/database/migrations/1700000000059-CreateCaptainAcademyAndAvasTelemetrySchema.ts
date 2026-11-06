import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCaptainAcademyAndAvasTelemetrySchema1700000000059 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_training_certifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" character varying(64) NOT NULL,
        "course_type" character varying(64) NOT NULL,
        "exam_score_percent" numeric(5,2) NOT NULL,
        "eco_driving_kwh_per_100km" numeric(5,2) NOT NULL,
        "passed" boolean NOT NULL DEFAULT false,
        "awarded_badge" character varying(64) NOT NULL,
        "commission_discount_bps" integer NOT NULL DEFAULT 0,
        "valid_until" TIMESTAMP WITH TIME ZONE NOT NULL,
        "verification_url" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_training_certifications_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "avas_sound_telemetries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "speed_kmph" numeric(5,2) NOT NULL,
        "acoustic_chime_db" numeric(5,2) NOT NULL,
        "is_chime_enabled" boolean NOT NULL DEFAULT true,
        "is_pedestrian_zone" boolean NOT NULL DEFAULT false,
        "status" character varying(32) NOT NULL,
        "is_compliant" boolean NOT NULL DEFAULT true,
        "penalty_paise" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_avas_sound_telemetries_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_academy_captain" ON "captain_training_certifications" ("captain_id");
      CREATE INDEX IF NOT EXISTS "idx_avas_vehicle" ON "avas_sound_telemetries" ("vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "avas_sound_telemetries";
      DROP TABLE IF EXISTS "captain_training_certifications";
    `);
  }
}
