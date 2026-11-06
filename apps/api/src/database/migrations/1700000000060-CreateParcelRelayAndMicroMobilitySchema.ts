import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParcelRelayAndMicroMobilitySchema1700000000060 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inter_depot_parcel_relays" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consignment_id" character varying(64) NOT NULL,
        "origin_locker_hub_id" character varying(64) NOT NULL,
        "transit_depot_id" character varying(64) NOT NULL,
        "destination_locker_hub_id" character varying(64) NOT NULL,
        "courier_van_vehicle_id" character varying(64) NOT NULL,
        "courier_captain_id" character varying(64) NOT NULL,
        "weight_grams" integer NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'SCHEDULED',
        "current_location_hub" character varying(64) NOT NULL,
        "next_scheduled_hub" character varying(64) NOT NULL,
        "verification_token" character varying(64) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inter_depot_parcel_relays_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "micro_mobility_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying(64) NOT NULL,
        "vehicle_code" character varying(64) NOT NULL,
        "vehicle_type" character varying(32) NOT NULL,
        "origin_dock_id" character varying(64) NOT NULL,
        "destination_dock_id" character varying(64),
        "status" character varying(32) NOT NULL DEFAULT 'UNLOCKED',
        "duration_minutes" integer NOT NULL DEFAULT 0,
        "distance_meters" integer NOT NULL DEFAULT 0,
        "base_unlock_fee_paise" integer NOT NULL DEFAULT 1000,
        "per_minute_fee_paise" integer NOT NULL DEFAULT 200,
        "gst_paise" integer NOT NULL DEFAULT 0,
        "total_charged_paise" integer NOT NULL DEFAULT 0,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_micro_mobility_sessions_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_relay_consignment" ON "inter_depot_parcel_relays" ("consignment_id");
      CREATE INDEX IF NOT EXISTS "idx_micro_mobility_user" ON "micro_mobility_sessions" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_micro_mobility_vehicle" ON "micro_mobility_sessions" ("vehicle_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "micro_mobility_sessions";
      DROP TABLE IF EXISTS "inter_depot_parcel_relays";
    `);
  }
}
