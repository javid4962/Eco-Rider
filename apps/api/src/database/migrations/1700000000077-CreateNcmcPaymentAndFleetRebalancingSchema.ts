import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNcmcPaymentAndFleetRebalancingSchema1700000000077 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ncmc_transit_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" character varying(120) NOT NULL,
        "booking_id" character varying(120) NOT NULL,
        "rider_id" character varying(120) NOT NULL,
        "card_identifier_hash" character varying(128) NOT NULL,
        "card_type" character varying(64) NOT NULL,
        "fare_paise" bigint NOT NULL,
        "clearinghouse_batch_id" character varying(120) NOT NULL,
        "status" character varying(32) NOT NULL,
        "authorized_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "settled_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_ncmc_transit_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ncmc_transit_transactions_tx" UNIQUE ("transaction_id")
      );

      CREATE TABLE IF NOT EXISTS "multi_district_rebalancing_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" character varying(64) NOT NULL,
        "source_district" character varying(64) NOT NULL,
        "target_district" character varying(64) NOT NULL,
        "target_zone_id" character varying(120) NOT NULL,
        "bounty_paise" bigint NOT NULL,
        "captain_id" character varying(120),
        "vehicle_id" character varying(120),
        "status" character varying(32) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_multi_district_rebalancing_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_multi_district_rebalancing_order_no" UNIQUE ("order_number")
      );

      CREATE INDEX IF NOT EXISTS "idx_ncmc_transactions_booking" ON "ncmc_transit_transactions" ("booking_id");
      CREATE INDEX IF NOT EXISTS "idx_multi_district_orders_status" ON "multi_district_rebalancing_orders" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "multi_district_rebalancing_orders";
      DROP TABLE IF EXISTS "ncmc_transit_transactions";
    `);
  }
}

