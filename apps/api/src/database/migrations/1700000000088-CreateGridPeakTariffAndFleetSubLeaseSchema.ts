import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGridPeakTariffAndFleetSubLeaseSchema1700000000088 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "grid_peak_tariff_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(64) NOT NULL,
        "discom" character varying(32) NOT NULL,
        "current_hour_of_day" integer NOT NULL,
        "active_charger_draw_kw" double precision NOT NULL,
        "base_tariff_paise_per_kwh" integer NOT NULL,
        "effective_rate_paise_per_kwh" integer NOT NULL,
        "peak_surcharge_paise_per_kwh" integer NOT NULL,
        "corridor_surge_multiplier" double precision NOT NULL,
        "tariff_period" character varying(32) NOT NULL,
        "is_peak_surge_active" boolean NOT NULL DEFAULT false,
        "throttle_advisory" character varying(255) NOT NULL,
        "evaluated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_grid_peak_tariff_logs_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "fleet_sub_lease_settlements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contract_id" character varying(64) NOT NULL,
        "vehicle_id" character varying(64) NOT NULL,
        "captain_id" character varying(64) NOT NULL,
        "fleet_owner_id" character varying(64) NOT NULL,
        "battery_asset_co_id" character varying(64) NOT NULL,
        "gross_fare_paise" bigint NOT NULL,
        "platform_fee_paise" bigint NOT NULL,
        "net_distributable_paise" bigint NOT NULL,
        "captain_share_paise" bigint NOT NULL,
        "fleet_owner_share_paise" bigint NOT NULL,
        "battery_asset_co_share_paise" bigint NOT NULL,
        "is_balanced" boolean NOT NULL DEFAULT true,
        "settled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fleet_sub_lease_settlements_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_grid_tariff_depot_period" ON "grid_peak_tariff_logs" ("depot_id", "tariff_period");
      CREATE INDEX IF NOT EXISTS "idx_sublease_contract_vehicle" ON "fleet_sub_lease_settlements" ("contract_id", "vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "fleet_sub_lease_settlements";
      DROP TABLE IF EXISTS "grid_peak_tariff_logs";
    `);
  }
}
