import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCarbonCreditAndPanicAudioSchema1700000000061 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carbon_credit_batches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batch_identifier" character varying(64) NOT NULL,
        "total_credits_minted" integer NOT NULL,
        "fractional_kg_carried_forward" numeric(8,2) NOT NULL DEFAULT 0,
        "total_avoided_co2_kg" numeric(10,2) NOT NULL,
        "total_electric_km" numeric(10,2) NOT NULL,
        "certifying_standard" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'MINTED',
        "verification_hash" character varying(128) NOT NULL,
        "minted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carbon_credit_batches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_carbon_credit_batches_ident" UNIQUE ("batch_identifier")
      );

      CREATE TABLE IF NOT EXISTS "panic_audio_incidents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ride_id" character varying(64) NOT NULL,
        "captain_id" character varying(64) NOT NULL,
        "rider_id" character varying(64) NOT NULL,
        "audio_duration_seconds" integer NOT NULL,
        "audio_checksum" character varying(128) NOT NULL,
        "stream_decibels_max" numeric(5,2) NOT NULL,
        "severity" character varying(64) NOT NULL,
        "police_112_notified" boolean NOT NULL DEFAULT false,
        "police_dispatch_token" character varying(64) NOT NULL,
        "trigger_source" character varying(64) NOT NULL,
        "action_taken" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_panic_audio_incidents_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_panic_ride" ON "panic_audio_incidents" ("ride_id");
      CREATE INDEX IF NOT EXISTS "idx_panic_captain" ON "panic_audio_incidents" ("captain_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "panic_audio_incidents";
      DROP TABLE IF EXISTS "carbon_credit_batches";
    `);
  }
}

