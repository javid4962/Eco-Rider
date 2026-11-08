import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterStatePermitAndBmsArcFlashSchema1700000000090 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inter_state_permit_passes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "corridor" character varying(64) NOT NULL,
        "permit_number" character varying(64) NOT NULL,
        "status" character varying(32) NOT NULL,
        "is_cleared_for_border_transit" boolean NOT NULL DEFAULT false,
        "border_toll_deduction_paise" bigint NOT NULL DEFAULT 0,
        "fastag_deducted" boolean NOT NULL DEFAULT false,
        "inter_state_transit_manifest_id" character varying(64) NOT NULL,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inter_state_permit_passes_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "bms_arc_flash_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "pack_serial" character varying(64) NOT NULL,
        "pack_voltage" double precision NOT NULL,
        "max_cell_differential_mv" double precision NOT NULL,
        "internal_resistance_mohms" double precision NOT NULL,
        "temp_rate_of_rise_c_per_sec" double precision NOT NULL,
        "hazard_level" character varying(64) NOT NULL,
        "contactor_isolation_commanded" boolean NOT NULL DEFAULT false,
        "aerosol_suppression_armed" boolean NOT NULL DEFAULT false,
        "recommended_driver_advisory" character varying(255) NOT NULL,
        "evaluated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bms_arc_flash_events_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_interstate_vehicle_corridor" ON "inter_state_permit_passes" ("vehicle_id", "corridor");
      CREATE INDEX IF NOT EXISTS "idx_bms_arc_flash_vehicle_pack" ON "bms_arc_flash_events" ("vehicle_id", "pack_serial");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "bms_arc_flash_events";
      DROP TABLE IF EXISTS "inter_state_permit_passes";
    `);
  }
}

