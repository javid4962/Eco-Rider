import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCargoLogisticsSchema1700000000028 implements MigrationInterface {
  name = 'CreateCargoLogisticsSchema1700000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create cargo_shipments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cargo_shipments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tracking_number" VARCHAR(64) NOT NULL UNIQUE,
        "sender_id" UUID NOT NULL,
        "assigned_captain_id" UUID,
        "assigned_vehicle_id" UUID,
        "tier" VARCHAR(50) NOT NULL DEFAULT 'E_CARGO_2W',
        "status" VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
        "package_weight_kg" NUMERIC(8, 2) NOT NULL,
        "package_description" VARCHAR(255) NOT NULL,
        "requires_helper" BOOLEAN NOT NULL DEFAULT false,
        "base_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "weight_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "distance_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "stops_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "helper_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "gst_paise" BIGINT NOT NULL DEFAULT 0,
        "total_fare_paise" BIGINT NOT NULL DEFAULT 0,
        "total_cod_paise" BIGINT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cargo_shipment_sender" ON "cargo_shipments"("sender_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cargo_shipment_captain" ON "cargo_shipments"("assigned_captain_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cargo_shipment_status" ON "cargo_shipments"("status");`,
    );

    // 2. Create cargo_stops table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cargo_stops" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "shipment_id" UUID NOT NULL REFERENCES "cargo_shipments"("id") ON DELETE CASCADE,
        "sequence" INT NOT NULL,
        "stop_type" VARCHAR(50) NOT NULL DEFAULT 'PICKUP',
        "address" VARCHAR(255) NOT NULL,
        "latitude" DOUBLE PRECISION NOT NULL,
        "longitude" DOUBLE PRECISION NOT NULL,
        "contact_name" VARCHAR(120) NOT NULL,
        "contact_phone" VARCHAR(20) NOT NULL,
        "instructions" TEXT,
        "cod_paise" BIGINT NOT NULL DEFAULT 0,
        "pod_otp" VARCHAR(6),
        "is_completed" BOOLEAN NOT NULL DEFAULT false,
        "recipient_name" VARCHAR(120),
        "signature_hash" VARCHAR(64),
        "completed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cargo_stop_shipment_seq" ON "cargo_stops"("shipment_id", "sequence");`,
    );

    // 3. Create cargo_cod_settlements table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cargo_cod_settlements" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "shipment_id" UUID NOT NULL,
        "stop_id" UUID NOT NULL,
        "captain_id" UUID NOT NULL,
        "merchant_account_id" UUID NOT NULL,
        "amount_paise" BIGINT NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'COLLECTED_BY_CAPTAIN',
        "collected_at" TIMESTAMPTZ NOT NULL,
        "settled_at" TIMESTAMPTZ,
        "reference_id" VARCHAR(120),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cargo_cod_shipment" ON "cargo_cod_settlements"("shipment_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cargo_cod_merchant" ON "cargo_cod_settlements"("merchant_account_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cargo_cod_status" ON "cargo_cod_settlements"("status");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cargo_cod_settlements";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cargo_stops";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cargo_shipments";`);
  }
}

