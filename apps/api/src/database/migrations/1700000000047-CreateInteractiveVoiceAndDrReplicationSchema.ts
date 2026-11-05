import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInteractiveVoiceAndDrReplicationSchema1700000000047 implements MigrationInterface {
  name = 'CreateInteractiveVoiceAndDrReplicationSchema1700000000047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. ivr_voice_sessions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ivr_voice_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" character varying(50) NOT NULL,
        "captain_id" uuid NOT NULL,
        "detected_utterance" text NOT NULL,
        "recognized_language" character varying(10) NOT NULL DEFAULT 'te',
        "parsed_intent" character varying(50) NOT NULL,
        "confidence_score" numeric(4,2) NOT NULL DEFAULT 0.95,
        "system_action_taken" character varying(150) NOT NULL,
        "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ivr_voice_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ivr_voice_sessions_num" UNIQUE ("session_id")
      )
    `);

    // 2. dr_replication_health
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dr_replication_health" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "primary_node_id" character varying(50) NOT NULL,
        "standby_node_id" character varying(50) NOT NULL,
        "regional_data_center" character varying(100) NOT NULL,
        "sync_state" character varying(50) NOT NULL DEFAULT 'STREAMING_HEALTHY',
        "replication_lag_bytes" bigint NOT NULL DEFAULT 0,
        "replication_lag_seconds" numeric(5,2) NOT NULL DEFAULT 0.1,
        "last_wal_received_lsn" character varying(50) NOT NULL,
        "last_wal_replayed_lsn" character varying(50) NOT NULL,
        "healthy" boolean NOT NULL DEFAULT true,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dr_replication_health_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "dr_replication_health"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ivr_voice_sessions"`);
  }
}

