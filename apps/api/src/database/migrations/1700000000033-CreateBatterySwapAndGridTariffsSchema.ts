import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBatterySwapAndGridTariffsSchema1700000000033 implements MigrationInterface {
  name = 'CreateBatterySwapAndGridTariffsSchema1700000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. battery_swap_stations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "battery_swap_stations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_code" character varying(50) NOT NULL,
        "name" character varying(150) NOT NULL,
        "city" character varying(50) NOT NULL,
        "address" text NOT NULL,
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "operator" character varying(100) NOT NULL,
        "total_bays" integer NOT NULL DEFAULT 12,
        "available_charged_packs" integer NOT NULL DEFAULT 8,
        "charging_packs" integer NOT NULL DEFAULT 4,
        "supported_models" jsonb NOT NULL,
        "swap_fee_paise" integer NOT NULL DEFAULT 10000,
        "status" character varying(30) NOT NULL DEFAULT 'OPERATIONAL',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_battery_swap_stations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_battery_swap_stations_code" UNIQUE ("station_code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_battery_swap_stations_city" ON "battery_swap_stations" ("city")
    `);

    // 2. battery_packs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "battery_packs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "serial_number" character varying(100) NOT NULL,
        "model" character varying(50) NOT NULL,
        "capacity_kwh" numeric(5,2) NOT NULL,
        "current_soc_percent" numeric(5,2) NOT NULL DEFAULT 100.0,
        "state_of_health_percent" numeric(5,2) NOT NULL DEFAULT 98.0,
        "cycle_count" integer NOT NULL DEFAULT 0,
        "temperature_celsius" numeric(4,1) NOT NULL DEFAULT 32.0,
        "health_status" character varying(30) NOT NULL DEFAULT 'EXCELLENT',
        "station_id" uuid,
        "assigned_vehicle_id" uuid,
        "is_ready_for_swap" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_battery_packs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_battery_packs_serial" UNIQUE ("serial_number")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_battery_packs_station" ON "battery_packs" ("station_id")
    `);

    // 3. battery_swap_transactions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "battery_swap_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_id" uuid NOT NULL,
        "station_code" character varying(50) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "deposited_pack_serial" character varying(100) NOT NULL,
        "deposited_soc_percent" numeric(5,2) NOT NULL,
        "dispensed_pack_serial" character varying(100) NOT NULL,
        "dispensed_soc_percent" numeric(5,2) NOT NULL,
        "energy_replenished_kwh" numeric(5,2) NOT NULL,
        "base_swap_fee_paise" integer NOT NULL,
        "tax_paise" integer NOT NULL,
        "total_amount_paise" integer NOT NULL,
        "idempotency_key" character varying(100),
        "swapped_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_battery_swap_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_battery_swap_transactions_idemp" UNIQUE ("idempotency_key")
      )
    `);

    // 4. grid_tariff_windows
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "grid_tariff_windows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone" character varying(50) NOT NULL,
        "start_hour_ist" integer NOT NULL,
        "end_hour_ist" integer NOT NULL,
        "rate_per_kwh_paise" integer NOT NULL,
        "discom_name" character varying(100) NOT NULL DEFAULT 'APCPDCL / APSPDCL',
        "is_green_energy_peak" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_grid_tariff_windows_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "grid_tariff_windows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "battery_swap_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "battery_packs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "battery_swap_stations"`);
  }
}

