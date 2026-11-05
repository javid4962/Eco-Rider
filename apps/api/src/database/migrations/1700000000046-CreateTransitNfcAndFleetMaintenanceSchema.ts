import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransitNfcAndFleetMaintenanceSchema1700000000046 implements MigrationInterface {
  name = 'CreateTransitNfcAndFleetMaintenanceSchema1700000000046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. transit_smart_cards
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transit_smart_cards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "card_uid_hash" character varying(64) NOT NULL,
        "user_id" uuid NOT NULL,
        "card_type" character varying(50) NOT NULL,
        "linked_wallet_balance_paise" integer NOT NULL DEFAULT 20000,
        "last_tap_station_code" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transit_smart_cards_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transit_smart_cards_uid" UNIQUE ("card_uid_hash")
      )
    `);

    // 2. nfc_tap_transactions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "nfc_tap_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "card_uid_hash" character varying(64) NOT NULL,
        "station_code" character varying(50) NOT NULL,
        "fare_deducted_paise" integer NOT NULL,
        "remaining_balance_paise" integer NOT NULL,
        "gate_opened" boolean NOT NULL DEFAULT true,
        "tapped_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nfc_tap_transactions_id" PRIMARY KEY ("id")
      )
    `);

    // 3. fleet_maintenance_orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_maintenance_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" character varying(50) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "service_type" character varying(50) NOT NULL,
        "depot_id" uuid NOT NULL,
        "current_odometer_km" integer NOT NULL,
        "trigger_reason" character varying(255) NOT NULL,
        "estimated_cost_paise" integer NOT NULL,
        "actual_cost_paise" integer,
        "status" character varying(30) NOT NULL DEFAULT 'SCHEDULED',
        "scheduled_date" date NOT NULL,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fleet_maintenance_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fleet_maintenance_orders_num" UNIQUE ("order_number")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fleet_maintenance_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "nfc_tap_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transit_smart_cards"`);
  }
}

