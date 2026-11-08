import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBatterySecondLifeAuctionAndIntercityTransitSchema1700000000092 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "battery_second_life_listings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pack_serial" character varying(64) NOT NULL,
        "original_capacity_kwh" double precision NOT NULL,
        "current_soh_percent" double precision NOT NULL,
        "cycle_count" integer NOT NULL,
        "remaining_capacity_kwh" double precision NOT NULL,
        "grade" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'LISTED',
        "estimated_salvage_valuation_paise" bigint NOT NULL,
        "recommended_stationary_bess_depot" character varying(64) NOT NULL,
        "evaluated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_battery_second_life_listings_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "intercity_seat_reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "passenger_id" character varying(64) NOT NULL,
        "route" character varying(64) NOT NULL,
        "seat_number" integer NOT NULL,
        "fare_paid_paise" bigint NOT NULL,
        "gst_paise" bigint NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'CONFIRMED',
        "qr_boarding_pass_payload" text NOT NULL,
        "reserved_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_intercity_seat_reservations_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_second_life_pack_grade" ON "battery_second_life_listings" ("pack_serial", "grade");
      CREATE INDEX IF NOT EXISTS "idx_intercity_route_seat" ON "intercity_seat_reservations" ("route", "seat_number");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "intercity_seat_reservations";
      DROP TABLE IF EXISTS "battery_second_life_listings";
    `);
  }
}
