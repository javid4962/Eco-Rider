import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHighwayRestStopAndGridCurtailmentSchema1700000000064 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "highway_rest_stop_vouchers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "voucher_code" character varying(64) NOT NULL,
        "booking_id" character varying(120) NOT NULL,
        "rider_id" character varying(120) NOT NULL,
        "captain_id" character varying(120) NOT NULL,
        "location" character varying(64) NOT NULL,
        "value_paise" bigint NOT NULL,
        "status" character varying(64) NOT NULL,
        "merchant_id" character varying(120),
        "redeemed_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_highway_rest_stop_vouchers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_highway_rest_stop_voucher_code" UNIQUE ("voucher_code")
      );

      CREATE TABLE IF NOT EXISTS "grid_curtailment_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "substation_id" character varying(120) NOT NULL,
        "grid_frequency_hz" numeric(5,2) NOT NULL,
        "status" character varying(64) NOT NULL,
        "curtailment_level" character varying(64) NOT NULL,
        "total_curtailed_kw" numeric(8,2) NOT NULL DEFAULT 0,
        "ancillary_credit_paise" bigint NOT NULL DEFAULT 0,
        "affected_gun_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_grid_curtailment_events_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_rest_stop_voucher_code" ON "highway_rest_stop_vouchers" ("voucher_code");
      CREATE INDEX IF NOT EXISTS "idx_curtailment_substation" ON "grid_curtailment_events" ("substation_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "grid_curtailment_events";
      DROP TABLE IF EXISTS "highway_rest_stop_vouchers";
    `);
  }
}
