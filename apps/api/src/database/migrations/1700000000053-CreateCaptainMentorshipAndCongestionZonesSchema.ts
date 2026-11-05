import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCaptainMentorshipAndCongestionZonesSchema1700000000053 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_mentorship_pairings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mentor_captain_id" character varying(64) NOT NULL,
        "mentor_tier" character varying(32) NOT NULL,
        "mentee_captain_id" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'ASSIGNED',
        "target_trips" integer NOT NULL DEFAULT 100,
        "completed_trips" integer NOT NULL DEFAULT 0,
        "minimum_rating" numeric(3,2) NOT NULL DEFAULT 4.85,
        "current_rating" numeric(3,2) NOT NULL DEFAULT 5.00,
        "bonus_amount_paise" integer NOT NULL DEFAULT 250000,
        "disbursed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_mentorship_pairings_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "congestion_zones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone_code" character varying(64) NOT NULL,
        "zone_name" character varying(128) NOT NULL,
        "city" character varying(64) NOT NULL,
        "center_latitude" numeric(10,6) NOT NULL,
        "center_longitude" numeric(10,6) NOT NULL,
        "radius_meters" integer NOT NULL DEFAULT 1500,
        "base_congestion_fee_paise" integer NOT NULL DEFAULT 2500,
        "max_multiplier" numeric(3,2) NOT NULL DEFAULT 2.00,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_congestion_zones_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_congestion_zones_code" UNIQUE ("zone_code")
      );

      CREATE INDEX IF NOT EXISTS "idx_mentorship_mentor" ON "captain_mentorship_pairings" ("mentor_captain_id");
      CREATE INDEX IF NOT EXISTS "idx_mentorship_mentee" ON "captain_mentorship_pairings" ("mentee_captain_id");
      CREATE INDEX IF NOT EXISTS "idx_congestion_zones_city" ON "congestion_zones" ("city");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "congestion_zones";
      DROP TABLE IF EXISTS "captain_mentorship_pairings";
    `);
  }
}
