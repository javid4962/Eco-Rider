import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepotGateAndTaxCertificateSchema1700000000080 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "depot_gate_access_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "depot_id" character varying(120) NOT NULL,
        "gate_id" character varying(64) NOT NULL,
        "gate_type" character varying(32) NOT NULL,
        "plate_number" character varying(32) NOT NULL,
        "rfid_tag_id" character varying(64) NOT NULL,
        "decision" character varying(64) NOT NULL,
        "barrier_opened" boolean NOT NULL DEFAULT false,
        "reason" character varying(256) NOT NULL,
        "scanned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_depot_gate_access_logs_id" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "tax_rebate_certificates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "certificate_number" character varying(64) NOT NULL,
        "taxpayer_pan" character varying(32) NOT NULL,
        "applicant_type" character varying(64) NOT NULL,
        "vehicle_vin" character varying(64) NOT NULL,
        "financial_year" character varying(16) NOT NULL,
        "eligible_deduction_paise" bigint NOT NULL,
        "qr_verification_url" character varying(256) NOT NULL,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tax_rebate_certificates_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tax_rebate_cert_no" UNIQUE ("certificate_number")
      );

      CREATE INDEX IF NOT EXISTS "idx_depot_gate_plate" ON "depot_gate_access_logs" ("plate_number");
      CREATE INDEX IF NOT EXISTS "idx_tax_rebate_pan" ON "tax_rebate_certificates" ("taxpayer_pan");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "tax_rebate_certificates";
      DROP TABLE IF EXISTS "depot_gate_access_logs";
    `);
  }
}
