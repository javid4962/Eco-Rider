import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCorporateApprovalsAndAis156SwapSchema1700000000056 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_requisitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "corporate_account_id" character varying(64) NOT NULL,
        "department_code" character varying(64) NOT NULL,
        "employee_user_id" character varying(64) NOT NULL,
        "manager_user_id" character varying(64) NOT NULL,
        "trip_purpose" character varying(255) NOT NULL,
        "estimated_fare_paise" integer NOT NULL,
        "approved_fare_cap_paise" integer NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'PENDING_MANAGER_APPROVAL',
        "reviewed_by" character varying(64),
        "decision_note" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corporate_requisitions_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "battery_swap_compatibility_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pack_serial_number" character varying(64) NOT NULL,
        "vendor_standard" character varying(64) NOT NULL,
        "vehicle_id" character varying(64),
        "max_cell_temp_celsius" numeric(5,2) NOT NULL,
        "min_cell_temp_celsius" numeric(5,2) NOT NULL,
        "cell_voltage_max_volts" numeric(5,3) NOT NULL,
        "cell_voltage_min_volts" numeric(5,3) NOT NULL,
        "insulation_resistance_megaohms" numeric(6,2) NOT NULL,
        "soc_percent" numeric(5,2) NOT NULL,
        "soh_percent" numeric(5,2) NOT NULL,
        "verdict" character varying(64) NOT NULL,
        "is_eligible_for_swap" boolean NOT NULL DEFAULT false,
        "safety_interlock_engaged" boolean NOT NULL DEFAULT false,
        "reason" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_battery_swap_compatibility_logs_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_corp_req_account" ON "corporate_requisitions" ("corporate_account_id");
      CREATE INDEX IF NOT EXISTS "idx_corp_req_employee" ON "corporate_requisitions" ("employee_user_id");
      CREATE INDEX IF NOT EXISTS "idx_battery_swap_pack" ON "battery_swap_compatibility_logs" ("pack_serial_number");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "battery_swap_compatibility_logs";
      DROP TABLE IF EXISTS "corporate_requisitions";
    `);
  }
}
