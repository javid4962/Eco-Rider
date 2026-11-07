import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeederDiscountAndCableThermalSchema1700000000074 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "multimodal_feeder_discount_claims" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "claim_id" character varying(120) NOT NULL,
        "booking_id" character varying(120) NOT NULL,
        "rider_id" character varying(120) NOT NULL,
        "transit_hub_id" character varying(120) NOT NULL,
        "discount_paise" bigint NOT NULL,
        "claimed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_multimodal_feeder_claims_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_multimodal_feeder_claims_claim" UNIQUE ("claim_id")
      );

      CREATE TABLE IF NOT EXISTS "charging_cable_thermal_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "charger_bay_id" character varying(120) NOT NULL,
        "vehicle_id" character varying(120) NOT NULL,
        "cable_temperature_celsius" numeric(5,2) NOT NULL,
        "ambient_temperature_celsius" numeric(5,2) NOT NULL,
        "action_taken" character varying(64) NOT NULL,
        "adjusted_amps" numeric(6,2) NOT NULL,
        "alert_level" character varying(32) NOT NULL,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_charging_cable_thermal_logs_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_feeder_claims_booking" ON "multimodal_feeder_discount_claims" ("booking_id");
      CREATE INDEX IF NOT EXISTS "idx_cable_thermal_bay" ON "charging_cable_thermal_logs" ("charger_bay_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "charging_cable_thermal_logs";
      DROP TABLE IF EXISTS "multimodal_feeder_discount_claims";
    `);
  }
}

