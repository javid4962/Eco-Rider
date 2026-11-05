import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepotsAndMultiModalSchema1700000000032 implements MigrationInterface {
  name = 'CreateDepotsAndMultiModalSchema1700000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. fleet_depots table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fleet_depots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "code" character varying(50) NOT NULL,
        "city" character varying(50) NOT NULL DEFAULT 'Vijayawada',
        "address" character varying(255) NOT NULL,
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "total_parking_bays" integer NOT NULL DEFAULT 50,
        "available_parking_bays" integer NOT NULL DEFAULT 50,
        "total_charging_guns" integer NOT NULL DEFAULT 20,
        "available_charging_guns" integer NOT NULL DEFAULT 20,
        "is_government_authorized" boolean NOT NULL DEFAULT true,
        "security_contact" character varying(50) NOT NULL DEFAULT '+91 866 242 8999',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fleet_depots_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fleet_depots_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_fleet_depots_city" ON "fleet_depots" ("city")
    `);

    // 2. depot_bay_allocations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "depot_bay_allocations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" uuid NOT NULL,
        "vehicle_id" uuid NOT NULL,
        "bay_number" character varying(20) NOT NULL,
        "allocated_from" TIMESTAMP WITH TIME ZONE NOT NULL,
        "allocated_until" TIMESTAMP WITH TIME ZONE NOT NULL,
        "purpose" character varying(50) NOT NULL DEFAULT 'OVERNIGHT_PARKING',
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_depot_bay_allocations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_depot_allocations_depot" ON "depot_bay_allocations" ("depot_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_depot_allocations_vehicle" ON "depot_bay_allocations" ("vehicle_id")
    `);

    // 3. transit_hubs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transit_hubs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "hub_type" character varying(50) NOT NULL DEFAULT 'APSRTC_BUS_STATION',
        "city" character varying(50) NOT NULL DEFAULT 'Vijayawada',
        "address" character varying(255) NOT NULL,
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "dedicated_ev_pickup_bay" character varying(50) NOT NULL DEFAULT 'Bay-EV-1',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transit_hubs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transit_hubs_city" ON "transit_hubs" ("city")
    `);

    // 4. multi_modal_tickets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "multi_modal_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_number" character varying(50) NOT NULL,
        "booking_id" uuid NOT NULL,
        "rider_id" uuid NOT NULL,
        "transit_hub_id" uuid NOT NULL,
        "transit_hub_name" character varying(100) NOT NULL,
        "pickup_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "estimated_arrival_at_hub" TIMESTAMP WITH TIME ZONE NOT NULL,
        "fare_paise" bigint NOT NULL,
        "unified_qr_payload" text NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'CONFIRMED',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_multi_modal_tickets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_multi_modal_tickets_number" UNIQUE ("ticket_number")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mm_tickets_rider" ON "multi_modal_tickets" ("rider_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "multi_modal_tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transit_hubs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "depot_bay_allocations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fleet_depots"`);
  }
}

