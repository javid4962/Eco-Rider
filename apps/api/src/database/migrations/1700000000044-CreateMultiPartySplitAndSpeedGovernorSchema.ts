import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMultiPartySplitAndSpeedGovernorSchema1700000000044 implements MigrationInterface {
  name = 'CreateMultiPartySplitAndSpeedGovernorSchema1700000000044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. split_payout_batches
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "split_payout_batches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "total_gross_fare_paise" integer NOT NULL,
        "captain_share_paise" integer NOT NULL,
        "fleet_owner_share_paise" integer NOT NULL DEFAULT 0,
        "platform_fee_paise" integer NOT NULL,
        "gst_paise" integer NOT NULL,
        "disbursed_items" jsonb NOT NULL DEFAULT '[]',
        "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_split_payout_batches_id" PRIMARY KEY ("id")
      )
    `);

    // 2. split_payout_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "split_payout_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batch_id" uuid NOT NULL,
        "recipient_id" uuid NOT NULL,
        "recipient_role" character varying(30) NOT NULL,
        "payout_method" character varying(20) NOT NULL DEFAULT 'UPI',
        "payout_vpa_or_account" character varying(100) NOT NULL,
        "amount_paise" integer NOT NULL,
        "utr_reference" character varying(100),
        "status" character varying(30) NOT NULL DEFAULT 'PROCESSED',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_split_payout_items_id" PRIMARY KEY ("id")
      )
    `);

    // 3. speed_limit_zones
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "speed_limit_zones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone_code" character varying(50) NOT NULL,
        "zone_name" character varying(150) NOT NULL,
        "city" character varying(50) NOT NULL,
        "zone_type" character varying(50) NOT NULL,
        "max_speed_kmph" integer NOT NULL,
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "radius_meters" integer NOT NULL DEFAULT 300,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_speed_limit_zones_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_speed_limit_zones_code" UNIQUE ("zone_code")
      )
    `);

    // 4. speed_violation_incidents
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "speed_violation_incidents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_registration_number" character varying(50) NOT NULL,
        "captain_id" uuid NOT NULL,
        "zone_code" character varying(50) NOT NULL,
        "speed_limit_kmph" integer NOT NULL,
        "actual_speed_kmph" integer NOT NULL,
        "excess_speed_kmph" integer NOT NULL,
        "safety_score_penalty" integer NOT NULL DEFAULT 5,
        "warning_notice_telugu" text NOT NULL,
        "warning_notice_english" text NOT NULL,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_speed_violation_incidents_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "speed_violation_incidents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "speed_limit_zones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "split_payout_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "split_payout_batches"`);
  }
}

