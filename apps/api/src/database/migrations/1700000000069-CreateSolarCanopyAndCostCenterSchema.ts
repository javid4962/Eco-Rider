import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSolarCanopyAndCostCenterSchema1700000000069 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "solar_canopy_reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(120) NOT NULL,
        "bay_type" character varying(64) NOT NULL,
        "bay_number" character varying(32) NOT NULL,
        "captain_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "deposit_fee_paise" bigint NOT NULL DEFAULT 5000,
        "status" character varying(64) NOT NULL,
        "slot_start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "slot_end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_solar_canopy_reservations_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "corporate_cost_centers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "corporate_account_id" character varying(120) NOT NULL,
        "department_code" character varying(64) NOT NULL,
        "department_name" character varying(120) NOT NULL,
        "monthly_budget_limit_paise" bigint NOT NULL,
        "current_spend_paise" bigint NOT NULL DEFAULT 0,
        "status" character varying(64) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corporate_cost_centers_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_solar_canopy_depot" ON "solar_canopy_reservations" ("depot_id");
      CREATE INDEX IF NOT EXISTS "idx_cost_center_corp_dept" ON "corporate_cost_centers" ("corporate_account_id", "department_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "corporate_cost_centers";
      DROP TABLE IF EXISTS "solar_canopy_reservations";
    `);
  }
}
