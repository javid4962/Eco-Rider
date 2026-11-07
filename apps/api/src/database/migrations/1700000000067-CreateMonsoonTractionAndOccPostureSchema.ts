import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMonsoonTractionAndOccPostureSchema1700000000067 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "monsoon_traction_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(120) NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "surface_friction_mu" numeric(4,2) NOT NULL,
        "wheel_slip_percent" numeric(5,2) NOT NULL,
        "road_condition" character varying(64) NOT NULL,
        "adaptive_mode" character varying(64) NOT NULL,
        "max_torque_limit_percent" integer NOT NULL DEFAULT 100,
        "max_speed_limit_kmh" integer NOT NULL DEFAULT 80,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_monsoon_traction_events_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "occ_posture_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incident_code" character varying(120) NOT NULL,
        "previous_posture" character varying(64) NOT NULL,
        "new_posture" character varying(64) NOT NULL,
        "authorized_by" character varying(120) NOT NULL,
        "affected_vehicle_count" integer NOT NULL DEFAULT 0,
        "reason" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_occ_posture_audits_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_monsoon_vehicle" ON "monsoon_traction_events" ("vehicle_id");
      CREATE INDEX IF NOT EXISTS "idx_occ_incident" ON "occ_posture_audits" ("incident_code");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "occ_posture_audits";
      DROP TABLE IF EXISTS "monsoon_traction_events";
    `);
  }
}
