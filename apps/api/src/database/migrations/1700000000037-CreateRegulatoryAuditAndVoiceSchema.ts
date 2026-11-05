import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegulatoryAuditAndVoiceSchema1700000000037 implements MigrationInterface {
  name = 'CreateRegulatoryAuditAndVoiceSchema1700000000037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. regulatory_audit_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "regulatory_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_period" character varying(20) NOT NULL,
        "authority" character varying(50) NOT NULL DEFAULT 'AP_STA',
        "active_commercial_evs" integer NOT NULL,
        "electric_trips_completed" integer NOT NULL,
        "zero_emission_kilometers" numeric(10,2) NOT NULL,
        "co2_avoided_kg" numeric(10,2) NOT NULL,
        "ice_exclusions_enforced" integer NOT NULL,
        "statutory_gst_paise" integer NOT NULL,
        "digital_signature_sha256" character varying(64) NOT NULL,
        "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_regulatory_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    // 2. captain_voice_preferences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_voice_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" uuid NOT NULL,
        "preferred_audio_language" character varying(10) NOT NULL DEFAULT 'te',
        "voice_announcements_enabled" boolean NOT NULL DEFAULT true,
        "announce_fares_aloud" boolean NOT NULL DEFAULT true,
        "slow_audio_cadence_enabled" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_voice_preferences_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_captain_voice_preferences_cap" UNIQUE ("captain_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "captain_voice_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "regulatory_audit_logs"`);
  }
}

