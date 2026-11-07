import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRainCoverAndSmartDepotSchema1700000000076 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rain_cover_escrow_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "depot_hub_id" character varying(120) NOT NULL,
        "deposit_paise" bigint NOT NULL,
        "daily_rental_paise" bigint NOT NULL,
        "accumulated_rental_paise" bigint NOT NULL DEFAULT 0,
        "refunded_deposit_paise" bigint NOT NULL DEFAULT 0,
        "status" character varying(64) NOT NULL,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "returned_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_rain_cover_escrow_sessions_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "depot_smart_charging_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(120) NOT NULL,
        "total_allocated_kw" numeric(8,2) NOT NULL,
        "available_capacity_kw" numeric(8,2) NOT NULL,
        "unmet_demand_kw" numeric(8,2) NOT NULL,
        "allocations_json" text NOT NULL,
        "calculated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_depot_smart_charging_plans_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_rain_cover_captain" ON "rain_cover_escrow_sessions" ("captain_id");
      CREATE INDEX IF NOT EXISTS "idx_depot_charging_depot" ON "depot_smart_charging_plans" ("depot_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "depot_smart_charging_plans";
      DROP TABLE IF EXISTS "rain_cover_escrow_sessions";
    `);
  }
}
