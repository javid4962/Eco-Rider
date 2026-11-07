import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateV2hResidentialAndExecutiveKpiSchema1700000000072 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "v2h_residential_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "household_account_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "contracted_kwh" numeric(5,2) NOT NULL,
        "energy_delivered_kwh" numeric(5,2) NOT NULL DEFAULT 0,
        "discharge_tariff_paise_per_kwh" bigint NOT NULL DEFAULT 1400,
        "total_earnings_paise" bigint NOT NULL DEFAULT 0,
        "status" character varying(64) NOT NULL,
        "ended_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_v2h_residential_sessions_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "executive_kpi_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_date" character varying(16) NOT NULL,
        "total_zero_emission_km" numeric(12,2) NOT NULL,
        "total_passengers_moved" integer NOT NULL,
        "active_green_plate_vehicles" integer NOT NULL,
        "co2_avoided_kg" numeric(12,2) NOT NULL,
        "gst_passenger_5pct_paise" bigint NOT NULL,
        "gst_cargo_18pct_paise" bigint NOT NULL,
        "gst_services_18pct_paise" bigint NOT NULL,
        "total_gst_collected_paise" bigint NOT NULL,
        "safety_incident_rate_per_million_km" numeric(5,2) NOT NULL,
        "cryptographic_signature" character varying(128) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_executive_kpi_snapshots_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_executive_kpi_snapshots_date" UNIQUE ("report_date")
      );

      CREATE INDEX IF NOT EXISTS "idx_v2h_household" ON "v2h_residential_sessions" ("household_account_id");
      CREATE INDEX IF NOT EXISTS "idx_executive_kpi_date" ON "executive_kpi_snapshots" ("report_date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "executive_kpi_snapshots";
      DROP TABLE IF EXISTS "v2h_residential_sessions";
    `);
  }
}

