import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDriverMicrofinanceAndWeatherPricingSchema1700000000042 implements MigrationInterface {
  name = 'CreateDriverMicrofinanceAndWeatherPricingSchema1700000000042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. captain_emi_plans
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_emi_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" uuid NOT NULL,
        "lender_name" character varying(150) NOT NULL,
        "loan_account_number" character varying(50) NOT NULL,
        "total_principal_paise" integer NOT NULL,
        "total_interest_paise" integer NOT NULL,
        "daily_emi_installment_paise" integer NOT NULL,
        "remaining_balance_paise" integer NOT NULL,
        "total_paid_paise" integer NOT NULL DEFAULT 0,
        "max_deduction_cap_percentage" numeric(5,2) NOT NULL DEFAULT 25.0,
        "status" character varying(30) NOT NULL DEFAULT 'ACTIVE',
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_emi_plans_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_captain_emi_plans_loan" UNIQUE ("loan_account_number")
      )
    `);

    // 2. emi_deduction_records
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "emi_deduction_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "captain_id" uuid NOT NULL,
        "deduction_date" date NOT NULL,
        "gross_earnings_paise" integer NOT NULL,
        "requested_emi_paise" integer NOT NULL,
        "actual_deducted_paise" integer NOT NULL,
        "escrow_transferred_paise" integer NOT NULL,
        "capped_by_safety_rule" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emi_deduction_records_id" PRIMARY KEY ("id")
      )
    `);

    // 3. weather_condition_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "weather_condition_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone" character varying(100) NOT NULL,
        "city" character varying(50) NOT NULL,
        "event_type" character varying(50) NOT NULL DEFAULT 'CLEAR',
        "severity" character varying(30) NOT NULL DEFAULT 'NORMAL',
        "ambient_temperature_celsius" numeric(4,1) NOT NULL,
        "precipitation_mm_per_hour" numeric(5,2) NOT NULL DEFAULT 0,
        "wind_speed_kmph" numeric(5,2) NOT NULL DEFAULT 15.0,
        "is_weather_hardship_active" boolean NOT NULL DEFAULT false,
        "driver_allowance_multiplier" numeric(4,2) NOT NULL DEFAULT 1.0,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_weather_condition_logs_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "weather_condition_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emi_deduction_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "captain_emi_plans"`);
  }
}

