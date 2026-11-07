import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOcpiRoamingAndOccPttSchema1700000000082 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ocpi_roaming_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ocpi_session_id" character varying(120) NOT NULL,
        "partner_cpo_id" character varying(64) NOT NULL,
        "partner_station_id" character varying(120) NOT NULL,
        "ecoride_vehicle_vin" character varying(64) NOT NULL,
        "total_kwh" numeric(8,2) NOT NULL DEFAULT 0,
        "roaming_tariff_paise_per_kwh" bigint NOT NULL,
        "total_cost_paise" bigint NOT NULL DEFAULT 0,
        "clearinghouse_settlement_id" character varying(120) NOT NULL,
        "status" character varying(32) NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_ocpi_roaming_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ocpi_roaming_session_id" UNIQUE ("ocpi_session_id")
      );

      CREATE TABLE IF NOT EXISTS "occ_push_to_talk_channels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "channel_id" character varying(120) NOT NULL,
        "channel_name" character varying(120) NOT NULL,
        "district" character varying(64) NOT NULL,
        "active_listen_count" integer NOT NULL DEFAULT 0,
        "last_broadcast_by" character varying(120) NOT NULL,
        "priority" character varying(32) NOT NULL,
        "last_active_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_occ_push_to_talk_channels_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_occ_push_to_talk_channel_id" UNIQUE ("channel_id")
      );

      CREATE INDEX IF NOT EXISTS "idx_ocpi_sessions_vin" ON "ocpi_roaming_sessions" ("ecoride_vehicle_vin");
      CREATE INDEX IF NOT EXISTS "idx_occ_ptt_district" ON "occ_push_to_talk_channels" ("district");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "occ_push_to_talk_channels";
      DROP TABLE IF EXISTS "ocpi_roaming_sessions";
    `);
  }
}
