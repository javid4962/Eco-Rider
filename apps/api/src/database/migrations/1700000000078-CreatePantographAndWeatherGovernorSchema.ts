import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePantographAndWeatherGovernorSchema1700000000078 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pantograph_charging_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_number" character varying(64) NOT NULL,
        "bus_id" character varying(120) NOT NULL,
        "station_id" character varying(120) NOT NULL,
        "charger_bay_number" integer NOT NULL,
        "contact_pressure_newtons" numeric(6,2) NOT NULL,
        "alignment_status" character varying(64) NOT NULL,
        "initial_soc_pct" numeric(5,2) NOT NULL,
        "final_soc_pct" numeric(5,2) NOT NULL,
        "energy_delivered_kwh" numeric(8,2) NOT NULL DEFAULT 0,
        "peak_power_kw" numeric(6,2) NOT NULL,
        "tariff_paise_per_kwh" bigint NOT NULL,
        "total_cost_paise" bigint NOT NULL DEFAULT 0,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_pantograph_charging_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pantograph_sessions_session_no" UNIQUE ("session_number")
      );

      CREATE TABLE IF NOT EXISTS "weather_governor_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "corridor_id" character varying(64) NOT NULL,
        "severity" character varying(64) NOT NULL,
        "precipitation_mm_per_hr" numeric(6,2) NOT NULL,
        "visibility_meters" numeric(8,2) NOT NULL,
        "enforced_speed_limit_kmph" integer NOT NULL,
        "vehicles_notified_count" integer NOT NULL DEFAULT 0,
        "effective_from" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_weather_governor_events_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_pantograph_bus" ON "pantograph_charging_sessions" ("bus_id");
      CREATE INDEX IF NOT EXISTS "idx_weather_governor_corridor" ON "weather_governor_events" ("corridor_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "weather_governor_events";
      DROP TABLE IF EXISTS "pantograph_charging_sessions";
    `);
  }
}
