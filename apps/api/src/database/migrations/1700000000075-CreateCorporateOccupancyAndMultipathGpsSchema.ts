import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCorporateOccupancyAndMultipathGpsSchema1700000000075 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corporate_shift_reconciliations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "manifest_id" character varying(120) NOT NULL,
        "route_id" character varying(120) NOT NULL,
        "total_scheduled" integer NOT NULL,
        "total_boarded" integer NOT NULL,
        "total_absent" integer NOT NULL,
        "vehicle_capacity" integer NOT NULL,
        "occupancy_rate_pct" numeric(5,2) NOT NULL,
        "skipped_stops_count" integer NOT NULL DEFAULT 0,
        "reconciled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_corporate_shift_reconciliations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_corporate_shift_reconciliations_manifest" UNIQUE ("manifest_id")
      );

      CREATE TABLE IF NOT EXISTS "gps_multipath_filter_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(120) NOT NULL,
        "filtered_latitude" numeric(10,7) NOT NULL,
        "filtered_longitude" numeric(10,7) NOT NULL,
        "is_multipath_detected" boolean NOT NULL DEFAULT false,
        "confidence_score" numeric(4,2) NOT NULL,
        "canyon_zone_name" character varying(120),
        "corrected_drift_meters" numeric(8,2) NOT NULL DEFAULT 0,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gps_multipath_filter_logs_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_corp_shift_manifest" ON "corporate_shift_reconciliations" ("manifest_id");
      CREATE INDEX IF NOT EXISTS "idx_gps_multipath_vehicle" ON "gps_multipath_filter_logs" ("vehicle_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "gps_multipath_filter_logs";
      DROP TABLE IF EXISTS "corporate_shift_reconciliations";
    `);
  }
}
