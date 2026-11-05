import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHighwayFastChargingAndCaptainPensionSchema1700000000050 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "highway_charging_reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reservation_id" character varying(50) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "highway_plaza_id" character varying(50) NOT NULL,
        "highway_name" character varying(50) NOT NULL DEFAULT 'NH-16',
        "bay_number" character varying(20) NOT NULL,
        "target_arrival_window_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "target_arrival_window_end" TIMESTAMP WITH TIME ZONE NOT NULL,
        "deposit_paise" integer NOT NULL DEFAULT 10000,
        "status" character varying(30) NOT NULL DEFAULT 'RESERVED',
        "reserved_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_highway_charging_reservations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_highway_charging_reservations_num" UNIQUE ("reservation_id")
      );

      CREATE TABLE IF NOT EXISTS "captain_pension_accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" uuid NOT NULL,
        "pran_number" character varying(20) NOT NULL,
        "daily_contribution_paise" integer NOT NULL DEFAULT 2000,
        "total_accumulated_paise" bigint NOT NULL DEFAULT 0,
        "total_days_contributed" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_pension_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_captain_pension_accounts_captain" UNIQUE ("captain_id"),
        CONSTRAINT "UQ_captain_pension_accounts_pran" UNIQUE ("pran_number")
      );

      CREATE TABLE IF NOT EXISTS "pension_deduction_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" uuid NOT NULL,
        "trip_id" uuid,
        "deduction_amount_paise" integer NOT NULL,
        "accumulated_balance_after_paise" bigint NOT NULL,
        "deducted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pension_deduction_records_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "pension_deduction_records";
      DROP TABLE IF EXISTS "captain_pension_accounts";
      DROP TABLE IF EXISTS "highway_charging_reservations";
    `);
  }
}
