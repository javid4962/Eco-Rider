import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFleetOrganizationsAndAssignments1700000000013 implements MigrationInterface {
  name = 'CreateFleetOrganizationsAndAssignments1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create fleet_organizations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_organizations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "owner_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "name" VARCHAR(150) NOT NULL,
        "business_registration_number" VARCHAR(50) NOT NULL UNIQUE,
        "city" VARCHAR(50) NOT NULL DEFAULT 'visakhapatnam',
        "contact_phone" VARCHAR(20) NOT NULL,
        "contact_email" VARCHAR(100),
        "payout_account_id" VARCHAR(100) NOT NULL UNIQUE,
        "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chk_fleet_organizations_status"
          CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'))
      );

      CREATE INDEX IF NOT EXISTS "idx_fleet_orgs_owner_id" ON "fleet_organizations" ("owner_id");
      CREATE INDEX IF NOT EXISTS "idx_fleet_orgs_city" ON "fleet_organizations" ("city");
      CREATE INDEX IF NOT EXISTS "idx_fleet_orgs_status" ON "fleet_organizations" ("status");
    `);

    // 2. Add fleet_organization_id to vehicles
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "fleet_organization_id" UUID REFERENCES "fleet_organizations"("id") ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS "idx_vehicles_fleet_org_id" ON "vehicles" ("fleet_organization_id");
    `);

    // 3. Create fleet_vehicle_assignments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_vehicle_assignments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fleet_organization_id" UUID NOT NULL REFERENCES "fleet_organizations"("id") ON DELETE CASCADE,
        "vehicle_id" UUID NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
        "driver_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "assigned_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "unassigned_at" TIMESTAMPTZ,
        "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        "assignment_reason" VARCHAR(100) NOT NULL DEFAULT 'INITIAL_ASSIGNMENT',
        "notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chk_fleet_assignments_status"
          CHECK ("status" IN ('ACTIVE', 'COMPLETED', 'TERMINATED'))
      );

      CREATE INDEX IF NOT EXISTS "idx_fleet_assignments_org_id" ON "fleet_vehicle_assignments" ("fleet_organization_id");
      CREATE INDEX IF NOT EXISTS "idx_fleet_assignments_vehicle_status" ON "fleet_vehicle_assignments" ("vehicle_id", "status");
      CREATE INDEX IF NOT EXISTS "idx_fleet_assignments_driver_status" ON "fleet_vehicle_assignments" ("driver_id", "status");
    `);

    // 4. Create fleet_shifts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_shifts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fleet_organization_id" UUID NOT NULL REFERENCES "fleet_organizations"("id") ON DELETE CASCADE,
        "vehicle_id" UUID NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
        "driver_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "shift_type" VARCHAR(30) NOT NULL DEFAULT 'MORNING',
        "start_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "end_time" TIMESTAMPTZ,
        "start_soc_percent" NUMERIC(5,2) NOT NULL DEFAULT 100.00,
        "end_soc_percent" NUMERIC(5,2),
        "start_odometer_km" INT NOT NULL DEFAULT 0,
        "end_odometer_km" INT,
        "total_trips" INT NOT NULL DEFAULT 0,
        "total_earnings_paise" BIGINT NOT NULL DEFAULT 0,
        "status" VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chk_fleet_shifts_type"
          CHECK ("shift_type" IN ('MORNING', 'EVENING', 'NIGHT', 'CUSTOM')),
        CONSTRAINT "chk_fleet_shifts_status"
          CHECK ("status" IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'))
      );

      CREATE INDEX IF NOT EXISTS "idx_fleet_shifts_org_id" ON "fleet_shifts" ("fleet_organization_id");
      CREATE INDEX IF NOT EXISTS "idx_fleet_shifts_vehicle_id" ON "fleet_shifts" ("vehicle_id");
      CREATE INDEX IF NOT EXISTS "idx_fleet_shifts_driver_id" ON "fleet_shifts" ("driver_id");
      CREATE INDEX IF NOT EXISTS "idx_fleet_shifts_status" ON "fleet_shifts" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "fleet_shifts";
      DROP TABLE IF EXISTS "fleet_vehicle_assignments";
      DROP INDEX IF EXISTS "idx_vehicles_fleet_org_id";
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "fleet_organization_id";
      DROP TABLE IF EXISTS "fleet_organizations";
    `);
  }
}
