import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScope3EsgAndCaptainWelfareSchema1700000000045 implements MigrationInterface {
  name = 'CreateScope3EsgAndCaptainWelfareSchema1700000000045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. corporate_scope3_reports
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_scope3_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "corporate_account_id" uuid NOT NULL,
        "company_name" character varying(150) NOT NULL,
        "reporting_period" character varying(50) NOT NULL,
        "total_electric_trips" integer NOT NULL,
        "total_passenger_km" numeric(10,2) NOT NULL,
        "baseline_ice_emissions_kg_co2e" numeric(10,2) NOT NULL,
        "ev_emissions_kg_co2e" numeric(10,2) NOT NULL DEFAULT 0,
        "net_emissions_avoided_kg_co2e" numeric(10,2) NOT NULL,
        "diesel_displaced_liters" numeric(10,2) NOT NULL,
        "petrol_displaced_liters" numeric(10,2) NOT NULL,
        "iso_14064_hash" character varying(64) NOT NULL,
        "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corporate_scope3_reports_id" PRIMARY KEY ("id")
      )
    `);

    // 2. captain_welfare_ledger
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_welfare_ledger" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entry_type" character varying(20) NOT NULL,
        "booking_id" uuid,
        "captain_id" uuid,
        "amount_paise" integer NOT NULL,
        "balance_after_paise" integer NOT NULL,
        "description" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_welfare_ledger_id" PRIMARY KEY ("id")
      )
    `);

    // 3. medical_claims
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "medical_claims" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "claim_number" character varying(50) NOT NULL,
        "captain_id" uuid NOT NULL,
        "hospital_name" character varying(150) NOT NULL,
        "treatment_type" character varying(150) NOT NULL,
        "claim_amount_paise" integer NOT NULL,
        "approved_amount_paise" integer NOT NULL DEFAULT 0,
        "status" character varying(30) NOT NULL DEFAULT 'SUBMITTED',
        "discharge_summary_url" character varying(255) NOT NULL,
        "disbursed_utr" character varying(100),
        "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_medical_claims_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_medical_claims_num" UNIQUE ("claim_number")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "medical_claims"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "captain_welfare_ledger"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corporate_scope3_reports"`);
  }
}

