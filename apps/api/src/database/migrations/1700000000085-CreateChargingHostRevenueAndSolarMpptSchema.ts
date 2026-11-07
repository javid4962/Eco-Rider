import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChargingHostRevenueAndSolarMpptSchema1700000000085 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "charging_host_settlements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_id" character varying(64) NOT NULL,
        "landlord_id" character varying(64) NOT NULL,
        "landlord_upi_id" character varying(128) NOT NULL,
        "property_location" character varying(128) NOT NULL,
        "billing_period_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "billing_period_end" TIMESTAMP WITH TIME ZONE NOT NULL,
        "total_energy_kwh" double precision NOT NULL,
        "gross_revenue_paise" bigint NOT NULL,
        "electricity_cost_paise" bigint NOT NULL,
        "gross_margin_paise" bigint NOT NULL,
        "landlord_share_bps" integer NOT NULL,
        "landlord_gross_payout_paise" bigint NOT NULL,
        "gst_amount_paise" bigint NOT NULL,
        "tds_deduction_paise" bigint NOT NULL,
        "net_landlord_disbursal_paise" bigint NOT NULL,
        "platform_share_paise" bigint NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'PENDING',
        "disbursed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_charging_host_settlements_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "solar_mppt_coupling_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(64) NOT NULL,
        "pv_array_id" character varying(64) NOT NULL,
        "charger_gun_id" character varying(64) NOT NULL,
        "vehicle_id" character varying(64) NOT NULL,
        "solar_irradiance_w_per_m2" double precision NOT NULL,
        "mppt_dc_bus_voltage_volts" double precision NOT NULL,
        "solar_dc_current_amps" double precision NOT NULL,
        "solar_power_kw" double precision NOT NULL,
        "vehicle_demand_kw" double precision NOT NULL,
        "grid_power_import_kw" double precision NOT NULL DEFAULT 0.0,
        "dc_conversion_efficiency_percent" double precision NOT NULL DEFAULT 98.5,
        "avoided_ac_dc_loss_kwh" double precision NOT NULL DEFAULT 0.0,
        "coupling_mode" character varying(32) NOT NULL DEFAULT 'DIRECT_SOLAR_DC',
        "session_started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "session_ended_at" TIMESTAMP WITH TIME ZONE,
        "total_solar_energy_delivered_kwh" double precision NOT NULL DEFAULT 0.0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_solar_mppt_coupling_sessions_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_charging_host_landlord_status" ON "charging_host_settlements" ("landlord_id", "status");
      CREATE INDEX IF NOT EXISTS "idx_solar_mppt_station_time" ON "solar_mppt_coupling_sessions" ("depot_id", "session_started_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "solar_mppt_coupling_sessions";
      DROP TABLE IF EXISTS "charging_host_settlements";
    `);
  }
}
