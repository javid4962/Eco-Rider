import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRegenHarvestAndCellDiagnosticSchema1700000000084 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "regen_harvest_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vehicle_id" character varying(64) NOT NULL,
        "trip_id" character varying(64),
        "corridor_segment" character varying(128) NOT NULL,
        "slope_grade_percent" double precision NOT NULL,
        "descent_distance_meters" double precision NOT NULL,
        "entry_speed_kmh" double precision NOT NULL,
        "exit_speed_kmh" double precision NOT NULL,
        "regen_torque_nm" double precision NOT NULL,
        "energy_recuperated_watt_hours" double precision NOT NULL,
        "pack_soc_percent" double precision NOT NULL,
        "cell_max_temperature_c" double precision NOT NULL,
        "regen_status" character varying(32) NOT NULL DEFAULT 'OPTIMAL',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_regen_harvest_logs_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "cell_diagnostic_gate_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(64) NOT NULL,
        "bay_number" character varying(32) NOT NULL,
        "battery_pack_serial" character varying(64) NOT NULL,
        "vehicle_id" character varying(64),
        "measured_swelling_mm" double precision NOT NULL,
        "max_allowable_swelling_mm" double precision NOT NULL DEFAULT 3.5,
        "internal_gas_pressure_k_pa" double precision NOT NULL,
        "cell_surface_temperature_c" double precision NOT NULL,
        "diagnostic_health" character varying(32) NOT NULL DEFAULT 'NORMAL',
        "charging_allowed" boolean NOT NULL DEFAULT true,
        "quarantine_triggered" boolean NOT NULL DEFAULT false,
        "fire_suppression_pre_armed" boolean NOT NULL DEFAULT false,
        "inspected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cell_diagnostic_gate_logs_id" PRIMARY KEY ("id")
      );

      CREATE INDEX IF NOT EXISTS "idx_regen_harvest_vehicle_slope" ON "regen_harvest_logs" ("vehicle_id", "corridor_segment");
      CREATE INDEX IF NOT EXISTS "idx_cell_diagnostic_pack_serial" ON "cell_diagnostic_gate_logs" ("battery_pack_serial", "inspected_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "cell_diagnostic_gate_logs";
      DROP TABLE IF EXISTS "regen_harvest_logs";
    `);
  }
}

