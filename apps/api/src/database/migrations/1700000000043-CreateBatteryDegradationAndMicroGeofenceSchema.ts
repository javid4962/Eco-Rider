import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBatteryDegradationAndMicroGeofenceSchema1700000000043 implements MigrationInterface {
  name = 'CreateBatteryDegradationAndMicroGeofenceSchema1700000000043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. battery_degradation_records
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "battery_degradation_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "battery_pack_serial" character varying(100) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "initial_capacity_kwh" numeric(5,2) NOT NULL,
        "current_capacity_kwh" numeric(5,2) NOT NULL,
        "state_of_health_percent" numeric(5,2) NOT NULL,
        "cycle_count" integer NOT NULL DEFAULT 0,
        "projected_rul_months" integer NOT NULL DEFAULT 36,
        "second_life_recommended" boolean NOT NULL DEFAULT false,
        "evaluated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_battery_degradation_records_id" PRIMARY KEY ("id")
      )
    `);

    // 2. bess_repurposing_orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bess_repurposing_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" character varying(50) NOT NULL,
        "battery_pack_serial" character varying(100) NOT NULL,
        "designated_depot_id" uuid NOT NULL,
        "intended_use" character varying(150) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'PENDING_INSPECTION',
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bess_repurposing_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bess_repurposing_orders_num" UNIQUE ("order_number")
      )
    `);

    // 3. municipal_micro_geofences
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "municipal_micro_geofences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone_code" character varying(50) NOT NULL,
        "name" character varying(150) NOT NULL,
        "city" character varying(50) NOT NULL,
        "authority" character varying(50) NOT NULL DEFAULT 'APCRDA',
        "rule_type" character varying(50) NOT NULL DEFAULT 'MANDATORY_STAGING_BAY',
        "max_staging_vehicles" integer NOT NULL DEFAULT 10,
        "current_staging_vehicles" integer NOT NULL DEFAULT 0,
        "boundary_coordinates" jsonb NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_municipal_micro_geofences_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_municipal_micro_geofences_code" UNIQUE ("zone_code")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "municipal_micro_geofences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bess_repurposing_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "battery_degradation_records"`);
  }
}

