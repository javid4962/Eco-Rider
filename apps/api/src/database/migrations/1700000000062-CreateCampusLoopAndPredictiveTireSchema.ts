import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCampusLoopAndPredictiveTireSchema1700000000062 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campus_shuttle_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campus_code" character varying(64) NOT NULL,
        "loop_name" character varying(128) NOT NULL,
        "vehicle_type" character varying(32) NOT NULL,
        "operating_frequency_minutes" integer NOT NULL DEFAULT 10,
        "first_departure_time" character varying(16) NOT NULL,
        "last_departure_time" character varying(16) NOT NULL,
        "fare_per_ride_paise" integer NOT NULL DEFAULT 1500,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campus_shuttle_schedules_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "predictive_tire_assessments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "odometer_km" integer NOT NULL,
        "front_tread_remaining_mm" numeric(4,2) NOT NULL,
        "rear_tread_remaining_mm" numeric(4,2) NOT NULL,
        "ambient_road_temp_celsius" numeric(5,2) NOT NULL,
        "tire_wear_status" character varying(32) NOT NULL,
        "estimated_remaining_useful_life_km" integer NOT NULL,
        "immediate_depot_service_required" boolean NOT NULL DEFAULT false,
        "work_order_ref" character varying(64),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_predictive_tire_assessments_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_campus_schedule" ON "campus_shuttle_schedules" ("campus_code");
      CREATE INDEX IF NOT EXISTS "idx_tire_vehicle" ON "predictive_tire_assessments" ("vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "predictive_tire_assessments";
      DROP TABLE IF EXISTS "campus_shuttle_schedules";
    `);
  }
}

