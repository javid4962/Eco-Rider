import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLostFoundCustodyAndDepotLoadBalancingSchema1700000000051 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lost_item_custody" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tracking_barcode" character varying(50) NOT NULL,
        "trip_id" uuid NOT NULL,
        "captain_id" uuid NOT NULL,
        "depot_id" uuid,
        "vault_locker_number" character varying(20),
        "item_category" character varying(50) NOT NULL,
        "description" character varying(255) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'LOGGED_BY_CAPTAIN',
        "claim_verification_otp_hash" character varying(100),
        "logged_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "returned_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_lost_item_custody_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lost_item_custody_barcode" UNIQUE ("tracking_barcode")
      );

      CREATE TABLE IF NOT EXISTS "depot_power_allocations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" uuid NOT NULL,
        "max_transformer_capacity_kw" numeric(8,2) NOT NULL,
        "total_allocated_kw" numeric(8,2) NOT NULL,
        "active_vehicles_count" integer NOT NULL,
        "load_shedding_active" boolean NOT NULL DEFAULT false,
        "calculated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_depot_power_allocations_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "depot_power_allocations";
      DROP TABLE IF EXISTS "lost_item_custody";
    `);
  }
}
