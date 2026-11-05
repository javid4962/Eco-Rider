import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmergencyRescueAndSmartChargingSchema1700000000038 implements MigrationInterface {
  name = 'CreateEmergencyRescueAndSmartChargingSchema1700000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. rescue_units
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rescue_units" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "unit_code" character varying(50) NOT NULL,
        "operator_name" character varying(150) NOT NULL,
        "mobile_charger_capacity_kw" numeric(5,2) NOT NULL DEFAULT 30.0,
        "current_battery_soc_percent" numeric(5,2) NOT NULL DEFAULT 90.0,
        "current_latitude" numeric(10,6) NOT NULL,
        "current_longitude" numeric(10,6) NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "service_radius_km" numeric(5,2) NOT NULL DEFAULT 25.0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rescue_units_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rescue_units_code" UNIQUE ("unit_code")
      )
    `);

    // 2. rescue_requests
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rescue_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_number" character varying(50) NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "captain_id" uuid NOT NULL,
        "service_type" character varying(50) NOT NULL,
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "landmark" character varying(255) NOT NULL,
        "current_soc_percent" numeric(5,2) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'REQUESTED',
        "assigned_rescue_unit_id" uuid,
        "estimated_arrival_minutes" integer,
        "fee_paise" integer NOT NULL DEFAULT 35000,
        "gst_paise" integer NOT NULL DEFAULT 6300,
        "total_amount_paise" integer NOT NULL DEFAULT 41300,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_rescue_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rescue_requests_ticket" UNIQUE ("ticket_number")
      )
    `);

    // 3. transformer_station_loads
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transformer_station_loads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_id" uuid NOT NULL,
        "station_name" character varying(150) NOT NULL,
        "grid_substation_name" character varying(150) NOT NULL,
        "transformer_capacity_kva" integer NOT NULL DEFAULT 500,
        "current_load_kw" numeric(6,2) NOT NULL DEFAULT 0,
        "load_percentage" numeric(5,2) NOT NULL DEFAULT 0,
        "is_throttling_active" boolean NOT NULL DEFAULT false,
        "active_charging_vehicles_count" integer NOT NULL DEFAULT 0,
        "recommended_max_kw_per_gun" numeric(5,2) NOT NULL DEFAULT 60.0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transformer_station_loads_id" PRIMARY KEY ("id")
      )
    `);

    // 4. smart_charging_profiles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "smart_charging_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_id" uuid NOT NULL,
        "connector_id" integer NOT NULL DEFAULT 1,
        "stack_level" integer NOT NULL DEFAULT 1,
        "charging_profile_purpose" character varying(50) NOT NULL DEFAULT 'TX_DEFAULT_PROFILE',
        "charging_rate_unit" character varying(10) NOT NULL DEFAULT 'W',
        "max_power_kw" numeric(5,2) NOT NULL,
        "start_period_seconds" integer NOT NULL DEFAULT 0,
        "valid_from" TIMESTAMP WITH TIME ZONE NOT NULL,
        "valid_to" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_smart_charging_profiles_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "smart_charging_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transformer_station_loads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rescue_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rescue_units"`);
  }
}

