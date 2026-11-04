import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommuterPassesAndRedemptionsSchema1700000000026 implements MigrationInterface {
  name = 'CreateCommuterPassesAndRedemptionsSchema1700000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create pass_plans table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pass_plans" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "name" VARCHAR(100) NOT NULL,
        "city" VARCHAR(50) NOT NULL,
        "pass_type" VARCHAR(50) NOT NULL DEFAULT 'MONTHLY_UNLIMITED',
        "price_paise" BIGINT NOT NULL,
        "validity_days" INT NOT NULL DEFAULT 30,
        "ride_limit" INT NOT NULL DEFAULT 60,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_pass_plans_code" ON "pass_plans"("code");`,
    );

    // 2. Create commuter_passes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "commuter_passes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "pass_number" VARCHAR(50) NOT NULL UNIQUE,
        "rider_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "plan_id" UUID NOT NULL REFERENCES "pass_plans"("id") ON DELETE RESTRICT,
        "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        "valid_from" TIMESTAMPTZ NOT NULL,
        "valid_until" TIMESTAMPTZ NOT NULL,
        "total_rides" INT NOT NULL DEFAULT 60,
        "rides_remaining" INT NOT NULL DEFAULT 60,
        "price_paise" BIGINT NOT NULL,
        "idempotency_key" VARCHAR(100) NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_commuter_passes_number" ON "commuter_passes"("pass_number");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_commuter_passes_rider" ON "commuter_passes"("rider_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_commuter_passes_plan" ON "commuter_passes"("plan_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_commuter_passes_status" ON "commuter_passes"("status");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_commuter_passes_idempotency" ON "commuter_passes"("idempotency_key");`,
    );

    // 3. Create pass_redemptions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pass_redemptions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "pass_id" UUID NOT NULL REFERENCES "commuter_passes"("id") ON DELETE CASCADE,
        "booking_id" UUID REFERENCES "bookings"("id") ON DELETE SET NULL,
        "trip_id" UUID REFERENCES "corridor_trips"("id") ON DELETE SET NULL,
        "idempotency_key" VARCHAR(100) NOT NULL UNIQUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_pass_redemptions_pass" ON "pass_redemptions"("pass_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_pass_redemptions_idempotency" ON "pass_redemptions"("idempotency_key");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pass_redemptions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "commuter_passes" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pass_plans" CASCADE;`);
  }
}

