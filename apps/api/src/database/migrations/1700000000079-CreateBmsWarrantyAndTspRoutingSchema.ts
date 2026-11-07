import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBmsWarrantyAndTspRoutingSchema1700000000079 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bms_warranty_telemetry_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(120) NOT NULL,
        "battery_serial" character varying(120) NOT NULL,
        "max_cell_temperature_celsius" numeric(5,2) NOT NULL,
        "action_taken" character varying(64) NOT NULL,
        "allowed_power_kw" numeric(6,2) NOT NULL,
        "depot_cooling_bay_assigned" character varying(120),
        "warranty_protection_active" boolean NOT NULL DEFAULT false,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bms_warranty_logs_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "multi_stop_tsp_routes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "route_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "ordered_stop_ids" text NOT NULL,
        "total_distance_km" numeric(8,2) NOT NULL,
        "estimated_energy_kwh" numeric(6,2) NOT NULL,
        "elevation_avoided_gain_meters" numeric(6,2) NOT NULL DEFAULT 0,
        "optimized_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_multi_stop_tsp_routes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_multi_stop_tsp_routes_route_id" UNIQUE ("route_id")
      );

      CREATE INDEX IF NOT EXISTS "idx_bms_warranty_vehicle" ON "bms_warranty_telemetry_logs" ("vehicle_id");
      CREATE INDEX IF NOT EXISTS "idx_multi_stop_vehicle" ON "multi_stop_tsp_routes" ("vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "multi_stop_tsp_routes";
      DROP TABLE IF EXISTS "bms_warranty_telemetry_logs";
    `);
  }
}
