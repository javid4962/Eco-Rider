import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCorporateTransportSchema1700000000027 implements MigrationInterface {
  name = 'CreateCorporateTransportSchema1700000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create corporate_accounts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_accounts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_name" VARCHAR(100) NOT NULL,
        "cin_or_registration" VARCHAR(50) NOT NULL UNIQUE,
        "gstin" VARCHAR(20) NOT NULL UNIQUE,
        "city" VARCHAR(50) NOT NULL,
        "contact_email" VARCHAR(100) NOT NULL,
        "contact_phone" VARCHAR(20) NOT NULL,
        "monthly_credit_limit_paise" BIGINT NOT NULL DEFAULT 5000000,
        "current_outstanding_paise" BIGINT NOT NULL DEFAULT 0,
        "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corporate_accounts_cin" ON "corporate_accounts"("cin_or_registration");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corporate_accounts_gstin" ON "corporate_accounts"("gstin");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corporate_accounts_status" ON "corporate_accounts"("status");`,
    );

    // 2. Create corporate_employees table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_employees" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "corporate_account_id" UUID NOT NULL REFERENCES "corporate_accounts"("id") ON DELETE CASCADE,
        "employee_code" VARCHAR(50) NOT NULL,
        "full_name" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(20) NOT NULL,
        "department" VARCHAR(50),
        "work_shift" VARCHAR(50) NOT NULL DEFAULT 'GENERAL_MORNING',
        "pickup_address" VARCHAR(255) NOT NULL,
        "pickup_latitude" DOUBLE PRECISION NOT NULL,
        "pickup_longitude" DOUBLE PRECISION NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_corp_emp_account_code" UNIQUE ("corporate_account_id", "employee_code")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corporate_employees_account" ON "corporate_employees"("corporate_account_id");`,
    );

    // 3. Create corporate_shift_manifests table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_shift_manifests" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "corporate_account_id" UUID NOT NULL REFERENCES "corporate_accounts"("id") ON DELETE CASCADE,
        "manifest_date" DATE NOT NULL,
        "shift_type" VARCHAR(50) NOT NULL DEFAULT 'GENERAL_MORNING',
        "assigned_vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL,
        "assigned_captain_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "employees_data" JSONB NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corporate_manifests_account" ON "corporate_shift_manifests"("corporate_account_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_corporate_manifests_date" ON "corporate_shift_manifests"("manifest_date");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "corporate_shift_manifests" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corporate_employees" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "corporate_accounts" CASCADE;`);
  }
}

