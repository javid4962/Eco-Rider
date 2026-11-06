import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateV2gAndSmartLockersSchema1700000000048 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "v2g_discharge_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" character varying(50) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "depot_id" uuid NOT NULL,
        "charger_gun_id" character varying(50) NOT NULL,
        "initial_soc_percent" integer NOT NULL,
        "current_soc_percent" integer NOT NULL,
        "min_soc_threshold_percent" integer NOT NULL DEFAULT 40,
        "energy_exported_kwh" numeric(8,2) NOT NULL DEFAULT 0,
        "feed_in_tariff_paise_per_kwh" integer NOT NULL DEFAULT 850,
        "total_revenue_earned_paise" integer NOT NULL DEFAULT 0,
        "status" character varying(30) NOT NULL DEFAULT 'SCHEDULED',
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_v2g_discharge_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_v2g_discharge_sessions_num" UNIQUE ("session_id")
      );

      CREATE TABLE IF NOT EXISTS "smart_locker_compartments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "locker_hub_id" character varying(50) NOT NULL,
        "compartment_number" character varying(20) NOT NULL,
        "size" character varying(20) NOT NULL DEFAULT 'MEDIUM',
        "status" character varying(20) NOT NULL DEFAULT 'AVAILABLE',
        "current_consignment_id" character varying(50),
        "release_otp_hash" character varying(100),
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_smart_locker_compartments_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "locker_access_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "locker_hub_id" character varying(50) NOT NULL,
        "compartment_number" character varying(20) NOT NULL,
        "action" character varying(30) NOT NULL,
        "actor_phone" character varying(20),
        "success" boolean NOT NULL DEFAULT true,
        "logged_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_locker_access_logs_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "locker_access_logs";
      DROP TABLE IF EXISTS "smart_locker_compartments";
      DROP TABLE IF EXISTS "v2g_discharge_sessions";
    `);
  }
}

