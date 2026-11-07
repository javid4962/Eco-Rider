import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLockboxAndPedestrianZoneSchema1700000000070 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "high_value_lockboxes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consignment_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "sender_phone" character varying(32) NOT NULL,
        "receiver_phone" character varying(32) NOT NULL,
        "sender_deposit_otp_hash" character varying(128) NOT NULL,
        "receiver_withdrawal_otp_hash" character varying(128) NOT NULL,
        "is_high_value_pharma" boolean NOT NULL DEFAULT false,
        "security_state" character varying(64) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_high_value_lockboxes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_high_value_lockboxes_consignment" UNIQUE ("consignment_id")
      );

      CREATE TABLE IF NOT EXISTS "micro_mobility_pedestrian_zones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone_code" character varying(64) NOT NULL,
        "zone_name" character varying(120) NOT NULL,
        "category" character varying(64) NOT NULL,
        "min_latitude" numeric(10,7) NOT NULL,
        "max_latitude" numeric(10,7) NOT NULL,
        "min_longitude" numeric(10,7) NOT NULL,
        "max_longitude" numeric(10,7) NOT NULL,
        "speed_limit_kmh" integer NOT NULL DEFAULT 12,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_micro_mobility_pedestrian_zones_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_micro_mobility_pedestrian_zones_code" UNIQUE ("zone_code")
      );

      CREATE INDEX IF NOT EXISTS "idx_lockbox_consignment" ON "high_value_lockboxes" ("consignment_id");
      CREATE INDEX IF NOT EXISTS "idx_pedestrian_zone_code" ON "micro_mobility_pedestrian_zones" ("zone_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "micro_mobility_pedestrian_zones";
      DROP TABLE IF EXISTS "high_value_lockboxes";
    `);
  }
}

