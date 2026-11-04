import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsAndInvoicesSchema1700000000023 implements MigrationInterface {
  name = 'CreatePaymentsAndInvoicesSchema1700000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create payment_records table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_records" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "booking_id" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE RESTRICT,
        "rider_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "gateway" VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
        "gateway_order_id" VARCHAR(100) UNIQUE,
        "gateway_payment_id" VARCHAR(100),
        "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        "amount_paise" BIGINT NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
        "payment_method" VARCHAR(50),
        "idempotency_key" VARCHAR(100) UNIQUE,
        "error_code" VARCHAR(100),
        "error_description" VARCHAR(255),
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payment_records_booking" ON "payment_records"("booking_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payment_records_rider" ON "payment_records"("rider_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payment_records_order" ON "payment_records"("gateway_order_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payment_records_payment" ON "payment_records"("gateway_payment_id");`,
    );

    // 2. Create tax_invoices table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tax_invoices" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoice_number" VARCHAR(50) NOT NULL UNIQUE,
        "booking_id" UUID NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE RESTRICT,
        "rider_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "sac_code" VARCHAR(20) NOT NULL DEFAULT '996412',
        "supplier_gstin" VARCHAR(20) NOT NULL DEFAULT '37AAAAA0000A1Z5',
        "supplier_state" VARCHAR(50) NOT NULL DEFAULT 'Andhra Pradesh',
        "supplier_state_code" VARCHAR(10) NOT NULL DEFAULT '37',
        "place_of_supply" VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh (37)',
        "base_fare_paise" BIGINT NOT NULL,
        "cgst_paise" BIGINT NOT NULL,
        "sgst_paise" BIGINT NOT NULL,
        "total_tax_paise" BIGINT NOT NULL,
        "total_amount_paise" BIGINT NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
        "invoice_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tax_invoices_number" ON "tax_invoices"("invoice_number");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tax_invoices_booking" ON "tax_invoices"("booking_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tax_invoices_rider" ON "tax_invoices"("rider_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tax_invoices" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_records" CASCADE;`);
  }
}

