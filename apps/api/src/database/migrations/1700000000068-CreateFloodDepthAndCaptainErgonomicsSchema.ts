import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFloodDepthAndCaptainErgonomicsSchema1700000000068 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flood_depth_assessments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "corridor_segment_id" character varying(120) NOT NULL,
        "sensor_location" character varying(120) NOT NULL,
        "water_depth_mm" integer NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "severity" character varying(64) NOT NULL,
        "is_corridor_closed" boolean NOT NULL DEFAULT false,
        "recommended_detour" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_flood_depth_assessments_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "captain_shift_ergonomics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "captain_id" character varying(120) NOT NULL,
        "continuous_driving_minutes" integer NOT NULL DEFAULT 0,
        "total_shift_minutes" integer NOT NULL DEFAULT 0,
        "duty_status" character varying(64) NOT NULL,
        "cooldown_expiry" TIMESTAMP WITH TIME ZONE,
        "last_rest_hub_id" character varying(120),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captain_shift_ergonomics_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_captain_shift_ergonomics_captain" UNIQUE ("captain_id")
      );

      CREATE INDEX IF NOT EXISTS "idx_flood_corridor" ON "flood_depth_assessments" ("corridor_segment_id");
      CREATE INDEX IF NOT EXISTS "idx_captain_ergonomics_captain" ON "captain_shift_ergonomics" ("captain_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "captain_shift_ergonomics";
      DROP TABLE IF EXISTS "flood_depth_assessments";
    `);
  }
}

