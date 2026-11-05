import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSustainabilityAndIncentivesSchema1700000000031 implements MigrationInterface {
  name = 'CreateSustainabilityAndIncentivesSchema1700000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. green_certificates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "green_certificates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "certificate_number" character varying(50) NOT NULL,
        "recipient_type" character varying(30) NOT NULL,
        "recipient_id" uuid NOT NULL,
        "recipient_name" character varying(100) NOT NULL,
        "total_electric_km" numeric(10,2) NOT NULL DEFAULT '0.00',
        "total_co2_saved_kg" numeric(10,2) NOT NULL DEFAULT '0.00',
        "total_green_trips" integer NOT NULL DEFAULT 0,
        "badge_level" character varying(50) NOT NULL DEFAULT 'SAPLING',
        "verification_url" character varying(255) NOT NULL,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_green_certificates_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_green_certificates_number" UNIQUE ("certificate_number")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_green_certs_recipient" ON "green_certificates" ("recipient_id", "recipient_type")
    `);

    // 2. incentive_challenges table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "incentive_challenges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(100) NOT NULL,
        "description" text NOT NULL,
        "target_trips" integer NOT NULL DEFAULT 10,
        "reward_paise" bigint NOT NULL DEFAULT 50000,
        "applicable_shift" character varying(50) NOT NULL DEFAULT 'DAILY_ALL',
        "city" character varying(50) NOT NULL DEFAULT 'Vijayawada',
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incentive_challenges_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_challenges_active" ON "incentive_challenges" ("is_active")
    `);

    // 3. captain_tier_progress table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_tier_progress" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" uuid NOT NULL,
        "tier" character varying(20) NOT NULL DEFAULT 'BRONZE',
        "weekly_completed_trips" integer NOT NULL DEFAULT 0,
        "acceptance_rate_percent" numeric(5,2) NOT NULL DEFAULT '100.00',
        "cancellation_rate_percent" numeric(5,2) NOT NULL DEFAULT '0.00',
        "customer_rating" numeric(3,2) NOT NULL DEFAULT '5.00',
        "commission_discount_bps" integer NOT NULL DEFAULT 0,
        "per_trip_bonus_paise" bigint NOT NULL DEFAULT 0,
        "current_period_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "current_period_end" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_tier_progress_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_captain_tier_progress_captain" UNIQUE ("captain_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "captain_tier_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "incentive_challenges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "green_certificates"`);
  }
}

