import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDisputesAndDemandForecastSchema1700000000036 implements MigrationInterface {
  name = 'CreateDisputesAndDemandForecastSchema1700000000036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. customer_disputes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_disputes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_number" character varying(50) NOT NULL,
        "booking_id" uuid NOT NULL,
        "complainant_user_id" uuid NOT NULL,
        "complainant_role" character varying(20) NOT NULL,
        "category" character varying(50) NOT NULL,
        "description" text NOT NULL,
        "claimed_amount_paise" integer,
        "auto_refund_applied_paise" integer,
        "re_metred_variance_percent" numeric(5,2),
        "status" character varying(30) NOT NULL DEFAULT 'OPEN',
        "resolution_notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_disputes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customer_disputes_ticket" UNIQUE ("ticket_number")
      )
    `);

    // 2. lost_item_reports
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lost_item_reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_number" character varying(50) NOT NULL,
        "booking_id" uuid NOT NULL,
        "rider_id" uuid NOT NULL,
        "item_type" character varying(50) NOT NULL,
        "item_description" text NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'REPORTED',
        "tokenized_contact_url" character varying(255) NOT NULL,
        "reported_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lost_item_reports_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lost_item_reports_report" UNIQUE ("report_number")
      )
    `);

    // 3. zone_demand_forecasts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zone_demand_forecasts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone_id" character varying(50) NOT NULL,
        "zone_name" character varying(150) NOT NULL,
        "city" character varying(50) NOT NULL,
        "forecast_window_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "forecast_window_end" TIMESTAMP WITH TIME ZONE NOT NULL,
        "predicted_demand_level" character varying(30) NOT NULL,
        "expected_rides_count" integer NOT NULL,
        "current_available_captains" integer NOT NULL,
        "deficit_or_surplus_captains" integer NOT NULL,
        "repositioning_incentive_paise" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_zone_demand_forecasts_id" PRIMARY KEY ("id")
      )
    `);

    // 4. fleet_repositioning_orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_repositioning_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" character varying(50) NOT NULL,
        "captain_id" uuid NOT NULL,
        "origin_zone_name" character varying(150) NOT NULL,
        "destination_zone_name" character varying(150) NOT NULL,
        "incentive_bonus_paise" integer NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'OFFERED',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fleet_repositioning_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fleet_repositioning_orders_num" UNIQUE ("order_number")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fleet_repositioning_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "zone_demand_forecasts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lost_item_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_disputes"`);
  }
}

