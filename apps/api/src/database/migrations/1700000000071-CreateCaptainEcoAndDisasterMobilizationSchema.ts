import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCaptainEcoAndDisasterMobilizationSchema1700000000071 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_eco_driving_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "total_distance_km" numeric(8,2) NOT NULL,
        "regen_energy_recovered_kwh" numeric(6,2) NOT NULL,
        "energy_consumed_kwh" numeric(6,2) NOT NULL,
        "eco_score" integer NOT NULL,
        "tier" character varying(64) NOT NULL,
        "bonus_eligible" boolean NOT NULL DEFAULT false,
        "bonus_amount_paise" bigint NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_eco_driving_records_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "disaster_mobilization_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_reference" character varying(120) NOT NULL,
        "commanding_agency" character varying(120) NOT NULL,
        "mobilization_stage" character varying(64) NOT NULL,
        "civilian_booking_paused" boolean NOT NULL DEFAULT false,
        "total_requisitioned_vehicles" integer NOT NULL DEFAULT 0,
        "evacuated_citizens_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_disaster_mobilization_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_disaster_mobilization_incident" UNIQUE ("incident_reference")
      );

      CREATE INDEX IF NOT EXISTS "idx_eco_captain" ON "captain_eco_driving_records" ("captain_id");
      CREATE INDEX IF NOT EXISTS "idx_disaster_incident" ON "disaster_mobilization_logs" ("incident_reference");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "disaster_mobilization_logs";
      DROP TABLE IF EXISTS "captain_eco_driving_records";
    `);
  }
}

