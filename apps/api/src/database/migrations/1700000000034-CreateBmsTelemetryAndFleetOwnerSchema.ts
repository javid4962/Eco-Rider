import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBmsTelemetryAndFleetOwnerSchema1700000000034 implements MigrationInterface {
  name = 'CreateBmsTelemetryAndFleetOwnerSchema1700000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. vehicle_bms_telemetry
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicle_bms_telemetry" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" uuid NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "pack_voltage_volts" numeric(6,2) NOT NULL,
        "pack_current_amperes" numeric(6,2) NOT NULL,
        "cell_voltage_delta_mv" numeric(6,2) NOT NULL,
        "max_cell_temp_celsius" numeric(4,1) NOT NULL,
        "min_cell_temp_celsius" numeric(4,1) NOT NULL,
        "inverter_temp_celsius" numeric(4,1) NOT NULL,
        "motor_rpm" integer NOT NULL,
        "energy_consumption_wh_per_km" numeric(6,1) NOT NULL,
        "state_of_charge_percent" numeric(5,2) NOT NULL,
        "state_of_health_percent" numeric(5,2) NOT NULL,
        "bms_thermal_safety_level" character varying(30) NOT NULL DEFAULT 'NORMAL',
        "fault_codes" jsonb NOT NULL DEFAULT '[]',
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_bms_telemetry_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bms_telemetry_vehicle" ON "vehicle_bms_telemetry" ("vehicle_id", "recorded_at")
    `);

    // 2. bms_alert_incidents
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bms_alert_incidents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" uuid NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "severity" character varying(30) NOT NULL,
        "issue" character varying(255) NOT NULL,
        "diagnostic_data" jsonb NOT NULL DEFAULT '{}',
        "auto_lockout_applied" boolean NOT NULL DEFAULT false,
        "alert_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bms_alert_incidents_id" PRIMARY KEY ("id")
      )
    `);

    // 3. fleet_lease_contracts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_lease_contracts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fleet_owner_id" uuid NOT NULL,
        "captain_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "lease_model" character varying(50) NOT NULL,
        "daily_rent_paise" integer,
        "owner_share_percent" numeric(5,2),
        "captain_share_percent" numeric(5,2),
        "start_date" date NOT NULL,
        "end_date" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fleet_lease_contracts_id" PRIMARY KEY ("id")
      )
    `);

    // 4. fleet_owner_settlements
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_owner_settlements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "settlement_date" date NOT NULL,
        "fleet_owner_id" uuid NOT NULL,
        "active_vehicles_count" integer NOT NULL DEFAULT 1,
        "total_trips_completed" integer NOT NULL DEFAULT 0,
        "gross_fares_collected_paise" integer NOT NULL DEFAULT 0,
        "captain_payouts_paise" integer NOT NULL DEFAULT 0,
        "electricity_deductions_paise" integer NOT NULL DEFAULT 0,
        "maintenance_reserves_paise" integer NOT NULL DEFAULT 0,
        "net_fleet_owner_earnings_paise" integer NOT NULL DEFAULT 0,
        "status" character varying(30) NOT NULL DEFAULT 'PROCESSED',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fleet_owner_settlements_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fleet_owner_settlements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fleet_lease_contracts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bms_alert_incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicle_bms_telemetry"`);
  }
}

