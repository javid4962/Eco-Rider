import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVernacularVoicePromptAndScope3CarbonSchema1700000000091 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vernacular_voice_prompt_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" character varying(64) NOT NULL,
        "dialect" character varying(32) NOT NULL,
        "category" character varying(64) NOT NULL,
        "spoken_script_text" text NOT NULL,
        "haptic_pattern" character varying(64) NOT NULL,
        "estimated_audio_duration_seconds" integer NOT NULL,
        "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vernacular_voice_prompt_logs_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "scope3_carbon_certificates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "corporate_account_id" character varying(64) NOT NULL,
        "reporting_month" character varying(16) NOT NULL,
        "standard" character varying(64) NOT NULL,
        "total_electric_km" double precision NOT NULL,
        "avoided_co2_kg" double precision NOT NULL,
        "displaced_diesel_liters" double precision NOT NULL,
        "verification_status" character varying(32) NOT NULL DEFAULT 'CERTIFIED',
        "certificate_hash_sha256" character varying(64) NOT NULL,
        "certified_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scope3_carbon_certificates_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_voice_prompt_captain_cat" ON "vernacular_voice_prompt_logs" ("captain_id", "category");
      CREATE INDEX IF NOT EXISTS "idx_scope3_cert_corp_month" ON "scope3_carbon_certificates" ("corporate_account_id", "reporting_month");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "scope3_carbon_certificates";
      DROP TABLE IF EXISTS "vernacular_voice_prompt_logs";
    `);
  }
}

