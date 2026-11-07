import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSolarDepotAndFreightHashSchema1700000000073 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "solar_depot_microgrid_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(120) NOT NULL,
        "source_mode" character varying(64) NOT NULL,
        "grid_draw_kw" numeric(8,2) NOT NULL,
        "solar_bess_draw_kw" numeric(8,2) NOT NULL,
        "peak_shaved_kw" numeric(8,2) NOT NULL,
        "arbitrage_savings_paise" bigint NOT NULL,
        "is_peak_period" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_solar_depot_microgrid_events_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "freight_manifest_hash_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "manifest_id" character varying(120) NOT NULL,
        "consignor_gstin" character varying(32) NOT NULL,
        "consignee_gstin" character varying(32) NOT NULL,
        "origin_hub" character varying(120) NOT NULL,
        "destination_hub" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "total_weight_kg" numeric(10,2) NOT NULL,
        "item_count" integer NOT NULL,
        "battery_soc_start_pct" numeric(5,2) NOT NULL,
        "merkle_root_hash" character varying(128) NOT NULL,
        "cryptographic_signature" character varying(256) NOT NULL,
        "anchored_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_freight_manifest_hash_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freight_manifest_hash_records_manifest" UNIQUE ("manifest_id")
      );

      CREATE INDEX IF NOT EXISTS "idx_solar_depot_events_depot" ON "solar_depot_microgrid_events" ("depot_id");
      CREATE INDEX IF NOT EXISTS "idx_freight_manifest_records_manifest" ON "freight_manifest_hash_records" ("manifest_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "freight_manifest_hash_records";
      DROP TABLE IF EXISTS "solar_depot_microgrid_events";
    `);
  }
}
