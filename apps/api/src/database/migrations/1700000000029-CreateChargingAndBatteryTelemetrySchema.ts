import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChargingAndBatteryTelemetrySchema1700000000029 implements MigrationInterface {
  name = 'CreateChargingAndBatteryTelemetrySchema1700000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create charging_stations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "charging_stations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(120) NOT NULL,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "city" VARCHAR(60) NOT NULL,
        "address" VARCHAR(255) NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "operator" VARCHAR(120) NOT NULL,
        "total_guns" INT NOT NULL DEFAULT 4,
        "available_guns" INT NOT NULL DEFAULT 4,
        "supported_connectors" TEXT NOT NULL,
        "max_power_kw" INT NOT NULL DEFAULT 60,
        "tariff_per_kwh_paise" BIGINT NOT NULL DEFAULT 1800,
        "status" VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL',
        "amenities" TEXT NOT NULL DEFAULT '',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_charging_stations_city" ON "charging_stations"("city");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_charging_stations_status" ON "charging_stations"("status");`,
    );

    // 2. Create charging_reservations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "charging_reservations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "station_id" UUID NOT NULL REFERENCES "charging_stations"("id") ON DELETE CASCADE,
        "captain_id" UUID NOT NULL,
        "vehicle_id" UUID NOT NULL,
        "connector_type" VARCHAR(50) NOT NULL DEFAULT 'CCS2',
        "status" VARCHAR(50) NOT NULL DEFAULT 'RESERVED',
        "reserved_until" TIMESTAMPTZ NOT NULL,
        "kwh_consumed" NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
        "energy_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "gst_paise" BIGINT NOT NULL DEFAULT 0,
        "total_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_charging_res_station" ON "charging_reservations"("station_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_charging_res_captain" ON "charging_reservations"("captain_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_charging_res_status" ON "charging_reservations"("status");`,
    );

    // 3. Create battery_telemetry_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "battery_telemetry_logs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "vehicle_id" UUID NOT NULL,
        "captain_id" UUID NOT NULL,
        "soc_percent" NUMERIC(5, 2) NOT NULL,
        "estimated_range_km" NUMERIC(6, 2) NOT NULL,
        "source" VARCHAR(50) NOT NULL,
        "confidence_score" NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
        "battery_temperature_c" NUMERIC(4, 1),
        "is_lockout_triggered" BOOLEAN NOT NULL DEFAULT false,
        "logged_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_battery_telem_vehicle" ON "battery_telemetry_logs"("vehicle_id", "logged_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_battery_telem_captain" ON "battery_telemetry_logs"("captain_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "battery_telemetry_logs";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "charging_reservations";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "charging_stations";`);
  }
}

