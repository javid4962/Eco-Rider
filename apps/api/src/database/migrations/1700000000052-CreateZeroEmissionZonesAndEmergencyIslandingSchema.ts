import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateZeroEmissionZonesAndEmergencyIslandingSchema1700000000052 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "zero_emission_zones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "zone_code" character varying(50) NOT NULL,
        "zone_name" character varying(150) NOT NULL,
        "municipality" character varying(100) NOT NULL,
        "active_penalty_paise_for_ice" integer NOT NULL DEFAULT 100000,
        "enforce_bev_only" boolean NOT NULL DEFAULT true,
        "total_bev_crossings_today" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_zero_emission_zones_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_zero_emission_zones_code" UNIQUE ("zone_code")
      );

      CREATE TABLE IF NOT EXISTS "zez_compliance_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "certificate_number" character varying(50) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "zone_code" character varying(50) NOT NULL,
        "authorized_access" boolean NOT NULL DEFAULT true,
        "penalty_charged_paise" integer NOT NULL DEFAULT 0,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_zez_compliance_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_zez_compliance_records_num" UNIQUE ("certificate_number")
      );

      CREATE TABLE IF NOT EXISTS "emergency_power_missions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mission_id" character varying(50) NOT NULL,
        "target_facility_name" character varying(150) NOT NULL,
        "facility_type" character varying(50) NOT NULL,
        "assigned_fleet_vehicle_number" character varying(50) NOT NULL,
        "inverter_capacity_kw" integer NOT NULL DEFAULT 60,
        "battery_reserve_kwh" integer NOT NULL DEFAULT 70,
        "duration_hours_estimated" integer NOT NULL DEFAULT 4,
        "status" character varying(30) NOT NULL DEFAULT 'STANDBY',
        "dispatched_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emergency_power_missions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_emergency_power_missions_num" UNIQUE ("mission_id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "emergency_power_missions";
      DROP TABLE IF EXISTS "zez_compliance_records";
      DROP TABLE IF EXISTS "zero_emission_zones";
    `);
  }
}

