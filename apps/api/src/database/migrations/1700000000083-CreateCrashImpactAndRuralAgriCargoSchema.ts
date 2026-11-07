import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCrashImpactAndRuralAgriCargoSchema1700000000083 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crash_impact_telemetry_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "trip_id" character varying(64),
        "deceleration_g_force" double precision NOT NULL,
        "airbag_deployed" boolean NOT NULL DEFAULT false,
        "pyro_fuse_blown" boolean NOT NULL DEFAULT false,
        "hv_contactor_status" character varying(32) NOT NULL DEFAULT 'ISOLATED_SAFE',
        "pack_voltage_volts" double precision NOT NULL,
        "isolation_resistance_k_ohms" double precision NOT NULL,
        "latitude" double precision NOT NULL,
        "longitude" double precision NOT NULL,
        "speed_kmh_at_impact" double precision NOT NULL,
        "passenger_count" integer NOT NULL DEFAULT 1,
        "severity" character varying(32) NOT NULL DEFAULT 'MODERATE',
        "emergency_112_notified" boolean NOT NULL DEFAULT false,
        "emergency_dispatch_ref" character varying(64),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crash_impact_telemetry_events_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "agri_produce_consignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "consignment_code" character varying(64) NOT NULL,
        "farmer_id" character varying(64) NOT NULL,
        "farmer_name" character varying(128) NOT NULL,
        "farmer_aadhaar_masked" character varying(32) NOT NULL,
        "farmer_upi_id" character varying(128) NOT NULL,
        "mandal" character varying(64) NOT NULL,
        "district" character varying(64) NOT NULL,
        "produce_type" character varying(32) NOT NULL,
        "gross_weight_kg" double precision NOT NULL,
        "tare_weight_kg" double precision NOT NULL,
        "net_weight_kg" double precision NOT NULL,
        "rate_per_kg_paise" bigint NOT NULL,
        "gross_produce_value_paise" bigint NOT NULL,
        "apmc_cess_rate_bps" integer NOT NULL DEFAULT 100,
        "apmc_cess_amount_paise" bigint NOT NULL,
        "logistics_fee_paise" bigint NOT NULL,
        "net_farmer_payout_paise" bigint NOT NULL,
        "ev_cargo_vehicle_id" character varying(64) NOT NULL,
        "captain_id" character varying(64) NOT NULL,
        "markfed_hub_id" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'AGGREGATING',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agri_produce_consignments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_agri_produce_consignment_code" UNIQUE ("consignment_code")
      );

      CREATE INDEX IF NOT EXISTS "idx_crash_impact_vehicle_time" ON "crash_impact_telemetry_events" ("vehicle_id", "created_at");
      CREATE INDEX IF NOT EXISTS "idx_agri_consignment_mandal_status" ON "agri_produce_consignments" ("mandal", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "agri_produce_consignments";
      DROP TABLE IF EXISTS "crash_impact_telemetry_events";
    `);
  }
}
