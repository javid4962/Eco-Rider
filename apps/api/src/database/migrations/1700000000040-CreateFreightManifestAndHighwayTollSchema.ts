import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFreightManifestAndHighwayTollSchema1700000000040 implements MigrationInterface {
  name = 'CreateFreightManifestAndHighwayTollSchema1700000000040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. freight_manifests
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "freight_manifests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "manifest_number" character varying(50) NOT NULL,
        "origin_hub_code" character varying(50) NOT NULL,
        "destination_hub_code" character varying(50) NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "captain_id" uuid NOT NULL,
        "total_consignments" integer NOT NULL DEFAULT 1,
        "gross_weight_kg" numeric(8,2) NOT NULL,
        "payload_capacity_kg" numeric(8,2) NOT NULL,
        "volumetric_utilization_percent" numeric(5,2) NOT NULL,
        "consignments_data" jsonb NOT NULL DEFAULT '[]',
        "status" character varying(30) NOT NULL DEFAULT 'PLANNED',
        "weighbridge_tare_weight_kg" numeric(8,2),
        "weighbridge_gross_weight_kg" numeric(8,2),
        "dispatch_time" TIMESTAMP WITH TIME ZONE,
        "arrival_time" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_freight_manifests_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_freight_manifests_number" UNIQUE ("manifest_number")
      )
    `);

    // 2. toll_plazas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "toll_plazas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "toll_code" character varying(50) NOT NULL,
        "name" character varying(150) NOT NULL,
        "highway_code" character varying(50) NOT NULL,
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "geofence_radius_meters" integer NOT NULL DEFAULT 300,
        "car_jeep_van_toll_paise" integer NOT NULL,
        "light_commercial_toll_paise" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_toll_plazas_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_toll_plazas_code" UNIQUE ("toll_code")
      )
    `);

    // 3. toll_crossings
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "toll_crossings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "captain_id" uuid NOT NULL,
        "vehicle_registration_number" character varying(50) NOT NULL,
        "toll_plaza_code" character varying(50) NOT NULL,
        "toll_plaza_name" character varying(150) NOT NULL,
        "toll_amount_paise" integer NOT NULL,
        "fastag_deduction_ref" character varying(100) NOT NULL,
        "reimbursement_status" character varying(30) NOT NULL DEFAULT 'REIMBURSED',
        "reimbursed_at" TIMESTAMP WITH TIME ZONE,
        "detected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_toll_crossings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_toll_crossings_fastag" UNIQUE ("fastag_deduction_ref")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "toll_crossings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "toll_plazas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "freight_manifests"`);
  }
}

