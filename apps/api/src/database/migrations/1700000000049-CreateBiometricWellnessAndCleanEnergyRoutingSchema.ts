import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBiometricWellnessAndCleanEnergyRoutingSchema1700000000049 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_wellness_screenings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "screening_id" character varying(50) NOT NULL,
        "captain_id" uuid NOT NULL,
        "depot_id" uuid NOT NULL,
        "blood_alcohol_content_mg_dl" numeric(4,2) NOT NULL DEFAULT 0.0,
        "pulse_oximeter_spo2_percent" integer NOT NULL DEFAULT 98,
        "heart_rate_bpm" integer NOT NULL DEFAULT 72,
        "body_temperature_celsius" numeric(4,2) NOT NULL DEFAULT 36.8,
        "status" character varying(30) NOT NULL DEFAULT 'PASSED',
        "fit_for_duty" boolean NOT NULL DEFAULT true,
        "screened_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_wellness_screenings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_captain_wellness_screenings_num" UNIQUE ("screening_id")
      );

      CREATE TABLE IF NOT EXISTS "depot_solar_generations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" uuid NOT NULL,
        "depot_name" character varying(150) NOT NULL,
        "current_solar_output_kw" numeric(8,2) NOT NULL DEFAULT 0.0,
        "grid_carbon_intensity_g_co2_kwh" integer NOT NULL DEFAULT 720,
        "green_energy_percentage" numeric(5,2) NOT NULL DEFAULT 0.0,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_depot_solar_generations_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "depot_solar_generations";
      DROP TABLE IF EXISTS "captain_wellness_screenings";
    `);
  }
}

