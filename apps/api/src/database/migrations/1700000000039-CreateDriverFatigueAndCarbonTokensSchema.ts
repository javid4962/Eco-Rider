import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDriverFatigueAndCarbonTokensSchema1700000000039 implements MigrationInterface {
  name = 'CreateDriverFatigueAndCarbonTokensSchema1700000000039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. driver_duty_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "driver_duty_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" uuid NOT NULL,
        "shift_start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "last_trip_end_time" TIMESTAMP WITH TIME ZONE,
        "continuous_driving_minutes" integer NOT NULL DEFAULT 0,
        "total_daily_driving_minutes" integer NOT NULL DEFAULT 0,
        "consecutive_rest_minutes" integer NOT NULL DEFAULT 0,
        "fatigue_risk_level" character varying(30) NOT NULL DEFAULT 'NORMAL',
        "is_dispatch_blocked" boolean NOT NULL DEFAULT false,
        "lockout_expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_driver_duty_logs_id" PRIMARY KEY ("id")
      )
    `);

    // 2. carbon_token_wallets
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carbon_token_wallets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "total_tokens_minted" integer NOT NULL DEFAULT 0,
        "total_tokens_redeemed" integer NOT NULL DEFAULT 0,
        "available_balance_tokens" integer NOT NULL DEFAULT 0,
        "total_co2_avoided_kg" numeric(10,2) NOT NULL DEFAULT 0,
        "tier_badge" character varying(50) NOT NULL DEFAULT 'GREEN_COMMUTER',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carbon_token_wallets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_carbon_token_wallets_user" UNIQUE ("user_id")
      )
    `);

    // 3. carbon_reward_redemptions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carbon_reward_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "product_id" character varying(50) NOT NULL,
        "product_title" character varying(150) NOT NULL,
        "voucher_code" character varying(50) NOT NULL,
        "tokens_deducted" integer NOT NULL,
        "idempotency_key" character varying(100) NOT NULL,
        "redeemed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carbon_reward_redemptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_carbon_reward_redemptions_code" UNIQUE ("voucher_code"),
        CONSTRAINT "UQ_carbon_reward_redemptions_idemp" UNIQUE ("idempotency_key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "carbon_reward_redemptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carbon_token_wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "driver_duty_logs"`);
  }
}

