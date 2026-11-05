import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoyaltyAndReferralsSchema1700000000030 implements MigrationInterface {
  name = 'CreateLoyaltyAndReferralsSchema1700000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create promo_codes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promo_codes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "discount_type" VARCHAR(50) NOT NULL DEFAULT 'FLAT_DISCOUNT',
        "discount_value" INT NOT NULL,
        "max_discount_paise" BIGINT NOT NULL DEFAULT 5000,
        "min_fare_paise" BIGINT NOT NULL DEFAULT 5000,
        "applicable_service" VARCHAR(50) NOT NULL DEFAULT 'ALL',
        "usage_limit_per_user" INT NOT NULL DEFAULT 1,
        "total_usage_limit" INT NOT NULL DEFAULT 1000,
        "current_usage_count" INT NOT NULL DEFAULT 0,
        "valid_from" TIMESTAMPTZ NOT NULL,
        "valid_until" TIMESTAMPTZ NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_promo_codes_code" ON "promo_codes"("code");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_promo_codes_active" ON "promo_codes"("is_active");`,
    );

    // 2. Create user_referrals table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_referrals" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "referral_code" VARCHAR(30) NOT NULL,
        "referred_user_id" UUID,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "reward_paid_paise" BIGINT NOT NULL DEFAULT 0,
        "completed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_user_referrals_code" ON "user_referrals"("referral_code");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_user_referrals_user" ON "user_referrals"("user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_user_referrals_referred" ON "user_referrals"("referred_user_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_referrals";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "promo_codes";`);
  }
}

