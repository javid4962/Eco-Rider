import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFloodEvacuationAndWheelAlignmentSchema1700000000086 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flood_evacuation_alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sensor_location" character varying(128) NOT NULL,
        "canal_or_water_body" character varying(128) NOT NULL,
        "zone" character varying(64) NOT NULL,
        "water_depth_mm" double precision NOT NULL,
        "critical_threshold_mm" double precision NOT NULL DEFAULT 200.0,
        "flow_velocity_mps" double precision NOT NULL DEFAULT 0.0,
        "severity" character varying(32) NOT NULL DEFAULT 'NORMAL',
        "reroute_active_trips" boolean NOT NULL DEFAULT false,
        "evacuation_hub_name" character varying(128),
        "evacuation_hub_lat" double precision,
        "evacuation_hub_lng" double precision,
        "active_vehicles_notified_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_flood_evacuation_alerts_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "wheel_alignment_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "captain_id" character varying(64) NOT NULL,
        "rolling_window_km" double precision NOT NULL DEFAULT 100.0,
        "steering_angle_mean_offset_deg" double precision NOT NULL,
        "lateral_drift_rate_mps2" double precision NOT NULL,
        "yaw_rate_variance" double precision NOT NULL,
        "tire_scrub_severity_index" double precision NOT NULL,
        "estimated_tire_life_reduction_percent" double precision NOT NULL,
        "alignment_status" character varying(32) NOT NULL DEFAULT 'PERFECT',
        "depot_maintenance_required" boolean NOT NULL DEFAULT false,
        "maintenance_work_order_ref" character varying(64),
        "logged_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wheel_alignment_logs_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_flood_alert_zone_severity" ON "flood_evacuation_alerts" ("zone", "severity");
      CREATE INDEX IF NOT EXISTS "idx_wheel_alignment_vehicle_time" ON "wheel_alignment_logs" ("vehicle_id", "logged_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "wheel_alignment_logs";
      DROP TABLE IF EXISTS "flood_evacuation_alerts";
    `);
  }
}
