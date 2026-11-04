import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRideOtpSafeguardsAndThrottling1700000000022 implements MigrationInterface {
  name = 'AddRideOtpSafeguardsAndThrottling1700000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "start_otp_expires_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "start_otp_failed_attempts" INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "start_otp_locked_until" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "start_otp_rotated_at" TIMESTAMPTZ;
    `);

    // Backfill any existing bookings with a safe default expiration window
    await queryRunner.query(`
      UPDATE "bookings"
      SET "start_otp_expires_at" = "created_at" + INTERVAL '2 hours'
      WHERE "start_otp_expires_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "start_otp_rotated_at",
        DROP COLUMN IF EXISTS "start_otp_locked_until",
        DROP COLUMN IF EXISTS "start_otp_failed_attempts",
        DROP COLUMN IF EXISTS "start_otp_expires_at";
    `);
  }
}

