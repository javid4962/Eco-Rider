import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBessAndEwayBillSchema1700000000058 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "depot_bess_units" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(64) NOT NULL,
        "bess_unit_code" character varying(64) NOT NULL,
        "total_capacity_kwh" numeric(8,2) NOT NULL,
        "current_soc_percent" numeric(5,2) NOT NULL,
        "charge_rate_kw" numeric(6,2) NOT NULL DEFAULT 0,
        "discharge_rate_kw" numeric(6,2) NOT NULL DEFAULT 0,
        "temperature_celsius" numeric(5,2) NOT NULL,
        "current_mode" character varying(32) NOT NULL DEFAULT 'IDLE_STANDBY',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_depot_bess_units_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_depot_bess_units_code" UNIQUE ("bess_unit_code")
      );

      CREATE TABLE IF NOT EXISTS "eway_bill_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eway_bill_number" character varying(32) NOT NULL,
        "vehicle_registration_number" character varying(32) NOT NULL,
        "consignor_gstin" character varying(32) NOT NULL,
        "consignee_gstin" character varying(32) NOT NULL,
        "gross_weight_kg" numeric(8,2) NOT NULL,
        "vehicle_max_gvw_kg" numeric(8,2) NOT NULL,
        "checkpost_name" character varying(128) NOT NULL,
        "declared_goods_value_paise" bigint NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'VALID',
        "clearance_reference" character varying(64) NOT NULL,
        "valid_until" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_eway_bill_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_eway_bill_records_num" UNIQUE ("eway_bill_number")
      );

      CREATE INDEX IF NOT EXISTS "idx_bess_depot" ON "depot_bess_units" ("depot_id");
      CREATE INDEX IF NOT EXISTS "idx_eway_bill_vehicle" ON "eway_bill_records" ("vehicle_registration_number");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "eway_bill_records";
      DROP TABLE IF EXISTS "depot_bess_units";
    `);
  }
}
