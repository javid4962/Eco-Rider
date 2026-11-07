import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMicroMobilityBountyAndAqiMonitoringSchema1700000000066 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "micro_mobility_bounties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(120) NOT NULL,
        "session_id" character varying(120) NOT NULL,
        "zone_code" character varying(64) NOT NULL,
        "abandoned_latitude" numeric(10,7) NOT NULL,
        "abandoned_longitude" numeric(10,7) NOT NULL,
        "bounty_reward_paise" bigint NOT NULL DEFAULT 7500,
        "status" character varying(64) NOT NULL,
        "claimed_by_captain_id" character varying(120),
        "docked_hub_id" character varying(120),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_micro_mobility_bounties_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "aqi_monitoring_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "station_code" character varying(120) NOT NULL,
        "sensor_location" character varying(120) NOT NULL,
        "aqi_value" integer NOT NULL,
        "pm25" numeric(6,2) NOT NULL,
        "pm10" numeric(6,2) NOT NULL,
        "aqi_level" character varying(64) NOT NULL,
        "subsidy_active" boolean NOT NULL DEFAULT false,
        "subsidy_discount_percent" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_aqi_monitoring_records_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_bounty_vehicle" ON "micro_mobility_bounties" ("vehicle_id");
      CREATE INDEX IF NOT EXISTS "idx_aqi_station" ON "aqi_monitoring_records" ("station_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "aqi_monitoring_records";
      DROP TABLE IF EXISTS "micro_mobility_bounties";
    `);
  }
}
