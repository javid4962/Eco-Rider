import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoboticSwapAndGreenBondAuditSchema1700000000087 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "robotic_swap_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "swap_station_id" character varying(64) NOT NULL,
        "bay_number" character varying(32) NOT NULL,
        "vehicle_id" character varying(64) NOT NULL,
        "depleted_pack_serial" character varying(64) NOT NULL,
        "fresh_pack_serial" character varying(64) NOT NULL,
        "current_step" character varying(32) NOT NULL DEFAULT 'INITIALIZING',
        "duration_seconds" integer NOT NULL DEFAULT 0,
        "torque_newton_meters_applied" double precision NOT NULL,
        "locking_pins_engaged_count" integer NOT NULL DEFAULT 4,
        "canbus_handshake_ok" boolean NOT NULL DEFAULT false,
        "is_successful" boolean NOT NULL DEFAULT false,
        "fault_code" character varying(64),
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_robotic_swap_sessions_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "green_bond_audit_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reporting_period" character varying(32) NOT NULL,
        "bond_series_id" character varying(64) NOT NULL,
        "total_clean_km_traveled" double precision NOT NULL,
        "total_kwh_consumed" double precision NOT NULL,
        "solar_wind_share_percent" double precision NOT NULL,
        "displaced_diesel_liters" double precision NOT NULL,
        "avoided_co2_emissions_metric_tons" double precision NOT NULL,
        "green_jobs_generated_count" integer NOT NULL,
        "capital_expenditure_paise" bigint NOT NULL,
        "bond_proceeds_allocated_paise" bigint NOT NULL,
        "compliance_ratio_bps" integer NOT NULL DEFAULT 10000,
        "tamper_proof_certificate_sha256" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'CAG_AUDITED',
        "audited_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_green_bond_audit_reports_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_robotic_swap_station_vehicle" ON "robotic_swap_sessions" ("swap_station_id", "vehicle_id");
      CREATE INDEX IF NOT EXISTS "idx_green_bond_report_period_hash" ON "green_bond_audit_reports" ("reporting_period", "bond_series_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "green_bond_audit_reports";
      DROP TABLE IF EXISTS "robotic_swap_sessions";
    `);
  }
}

