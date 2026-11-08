import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpeedGovernorGeofenceAndDepotInventorySchema1700000000089 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "speed_governor_geofence_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "latitude" double precision NOT NULL,
        "longitude" double precision NOT NULL,
        "current_speed_kmph" double precision NOT NULL,
        "zone_type" character varying(64) NOT NULL,
        "mandated_speed_limit_kmph" double precision NOT NULL,
        "is_violation" boolean NOT NULL DEFAULT false,
        "throttle_limit_percent" double precision NOT NULL DEFAULT 100.0,
        "haptic_warning_issued" boolean NOT NULL DEFAULT false,
        "logged_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_speed_governor_geofence_logs_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "depot_work_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(64) NOT NULL,
        "vehicle_id" character varying(64) NOT NULL,
        "part_category" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'SCHEDULED',
        "odometer_km" double precision NOT NULL,
        "regen_cycles_count" integer NOT NULL,
        "estimated_labor_minutes" integer NOT NULL DEFAULT 60,
        "parts_reserved_units" integer NOT NULL DEFAULT 1,
        "preventive_alert_issued" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_depot_work_orders_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_speed_gov_vehicle_zone" ON "speed_governor_geofence_logs" ("vehicle_id", "zone_type");
      CREATE INDEX IF NOT EXISTS "idx_depot_work_orders_depot_vehicle" ON "depot_work_orders" ("depot_id", "vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "depot_work_orders";
      DROP TABLE IF EXISTS "speed_governor_geofence_logs";
    `);
  }
}

