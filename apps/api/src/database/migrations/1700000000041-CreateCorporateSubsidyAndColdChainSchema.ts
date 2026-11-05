import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCorporateSubsidyAndColdChainSchema1700000000041 implements MigrationInterface {
  name = 'CreateCorporateSubsidyAndColdChainSchema1700000000041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. corporate_subsidy_policies
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_subsidy_policies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "corporate_account_id" uuid NOT NULL,
        "company_name" character varying(150) NOT NULL,
        "gstin" character varying(20) NOT NULL,
        "subsidy_type" character varying(50) NOT NULL DEFAULT 'PERCENTAGE_SPLIT',
        "subsidy_percentage" numeric(5,2) NOT NULL DEFAULT 70.0,
        "max_per_trip_subsidy_paise" integer NOT NULL DEFAULT 20000,
        "monthly_per_employee_cap_paise" integer NOT NULL DEFAULT 500000,
        "allowed_zones" jsonb NOT NULL DEFAULT '[]',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corporate_subsidy_policies_id" PRIMARY KEY ("id")
      )
    `);

    // 2. employee_subsidy_claims
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_subsidy_claims" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "employee_user_id" uuid NOT NULL,
        "corporate_account_id" uuid NOT NULL,
        "total_trip_fare_paise" integer NOT NULL,
        "employer_subsidized_paise" integer NOT NULL,
        "employee_payable_paise" integer NOT NULL,
        "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_subsidy_claims_id" PRIMARY KEY ("id")
      )
    `);

    // 3. cold_chain_shipments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cold_chain_shipments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consignment_id" character varying(50) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "cargo_type" character varying(100) NOT NULL,
        "required_range" character varying(30) NOT NULL DEFAULT 'CHILLED',
        "min_allowed_temp_celsius" numeric(4,1) NOT NULL DEFAULT 2.0,
        "max_allowed_temp_celsius" numeric(4,1) NOT NULL DEFAULT 8.0,
        "current_temp_celsius" numeric(4,1) NOT NULL DEFAULT 4.5,
        "current_humidity_percent" numeric(5,2) NOT NULL DEFAULT 65.0,
        "is_excursion_detected" boolean NOT NULL DEFAULT false,
        "total_excursions_count" integer NOT NULL DEFAULT 0,
        "last_telemetry_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cold_chain_shipments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cold_chain_shipments_consignment" UNIQUE ("consignment_id")
      )
    `);

    // 4. cold_chain_telemetry_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cold_chain_telemetry_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shipment_id" uuid NOT NULL,
        "reefer_unit_id" character varying(50) NOT NULL,
        "sensor_temp_celsius" numeric(4,1) NOT NULL,
        "humidity_percent" numeric(5,2) NOT NULL,
        "compressor_active" boolean NOT NULL DEFAULT true,
        "reefer_battery_soc_percent" numeric(5,2) NOT NULL,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cold_chain_telemetry_logs_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cold_chain_telemetry_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cold_chain_shipments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_subsidy_claims"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corporate_subsidy_policies"`);
  }
}

