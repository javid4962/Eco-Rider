import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCorporateGreenAndReeferTelematicsSchema1700000000065 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_green_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employee_id" character varying(120) NOT NULL,
        "corporate_account_id" character varying(120) NOT NULL,
        "total_electric_km" numeric(10,2) NOT NULL DEFAULT 0,
        "total_kg_co2_saved" numeric(10,2) NOT NULL DEFAULT 0,
        "current_tier" character varying(64) NOT NULL,
        "green_points" integer NOT NULL DEFAULT 0,
        "unlocked_badges" text NOT NULL DEFAULT '',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corporate_green_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_corporate_green_employee" UNIQUE ("employee_id")
      );

      CREATE TABLE IF NOT EXISTS "reefer_telematics_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(120) NOT NULL,
        "consignment_id" character varying(120) NOT NULL,
        "cargo_category" character varying(64) NOT NULL,
        "target_temp_celsius" numeric(5,2) NOT NULL,
        "current_internal_temp_celsius" numeric(5,2) NOT NULL,
        "ambient_temp_celsius" numeric(5,2) NOT NULL,
        "compressor_rpm" integer NOT NULL DEFAULT 2500,
        "battery_soc_percent" numeric(5,2) NOT NULL,
        "status" character varying(64) NOT NULL,
        "commanded_setpoint_celsius" numeric(5,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reefer_telematics_logs_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_corporate_green_employee" ON "corporate_green_profiles" ("employee_id");
      CREATE INDEX IF NOT EXISTS "idx_reefer_consignment" ON "reefer_telematics_logs" ("consignment_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "reefer_telematics_logs";
      DROP TABLE IF EXISTS "corporate_green_profiles";
    `);
  }
}
