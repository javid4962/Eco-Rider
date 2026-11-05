import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateColdChainInsuranceAndAirportFeederSchema1700000000054 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cold_chain_excursion_claims" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cargo_trip_id" character varying(64) NOT NULL,
        "vehicle_id" character varying(64) NOT NULL,
        "consignor_id" character varying(64) NOT NULL,
        "cargo_type" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'EXCURSION_DETECTED',
        "breach_temperature_celsius" numeric(5,2) NOT NULL,
        "min_allowed_temp_celsius" numeric(5,2) NOT NULL,
        "max_allowed_temp_celsius" numeric(5,2) NOT NULL,
        "excursion_duration_minutes" integer NOT NULL DEFAULT 15,
        "declared_value_paise" bigint NOT NULL,
        "insurance_claim_amount_paise" integer NOT NULL,
        "claim_reference_number" character varying(64) NOT NULL,
        "filing_reason" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cold_chain_excursion_claims_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cold_chain_excursion_claims_ref" UNIQUE ("claim_reference_number")
      );

      CREATE TABLE IF NOT EXISTS "airport_feeder_bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "rider_id" character varying(64) NOT NULL,
        "flight_number" character varying(32) NOT NULL,
        "airline" character varying(64) NOT NULL,
        "origin_iata" character varying(8) NOT NULL,
        "scheduled_arrival_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "actual_arrival_time" TIMESTAMP WITH TIME ZONE,
        "delay_minutes" integer NOT NULL DEFAULT 0,
        "assigned_pickup_bay" character varying(64) NOT NULL DEFAULT 'EV_DEDICATED_BAY_01',
        "status" character varying(32) NOT NULL DEFAULT 'CONFIRMED',
        "fare_paise" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_airport_feeder_bookings_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_cold_chain_trip" ON "cold_chain_excursion_claims" ("cargo_trip_id");
      CREATE INDEX IF NOT EXISTS "idx_cold_chain_consignor" ON "cold_chain_excursion_claims" ("consignor_id");
      CREATE INDEX IF NOT EXISTS "idx_airport_feeder_flight" ON "airport_feeder_bookings" ("flight_number");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "airport_feeder_bookings";
      DROP TABLE IF EXISTS "cold_chain_excursion_claims";
    `);
  }
}
