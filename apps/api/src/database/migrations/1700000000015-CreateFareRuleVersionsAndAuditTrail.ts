import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFareRuleVersionsAndAuditTrail1700000000015 implements MigrationInterface {
  name = 'CreateFareRuleVersionsAndAuditTrail1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create fare_rules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fare_rules" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "rule_code" VARCHAR(50) NOT NULL,
        "version" INT NOT NULL DEFAULT 1,
        "city" VARCHAR(50) NOT NULL,
        "service_category" VARCHAR(50) NOT NULL,
        "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        "base_fare_paise" INT NOT NULL,
        "base_distance_meters" INT NOT NULL DEFAULT 1000,
        "per_km_rate_paise" INT NOT NULL,
        "per_minute_rate_paise" INT NOT NULL DEFAULT 0,
        "waiting_charge_paise_per_minute" INT NOT NULL DEFAULT 0,
        "minimum_fare_paise" INT NOT NULL DEFAULT 2500,
        "surge_multiplier" NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
        "tax_rate_bps" INT NOT NULL DEFAULT 500,
        "commission_rate_bps" INT NOT NULL DEFAULT 1500,
        "promotions" JSONB,
        "effective_from" TIMESTAMPTZ NOT NULL,
        "effective_to" TIMESTAMPTZ,
        "is_illustrative" BOOLEAN NOT NULL DEFAULT false,
        "created_by_id" UUID,
        "approved_by_id" UUID,
        "approved_at" TIMESTAMPTZ,
        "evidence_reference" VARCHAR(255),
        "rejection_reason" TEXT,
        "notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chk_fare_rules_status"
          CHECK ("status" IN ('DRAFT', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'REJECTED', 'ARCHIVED')),
        CONSTRAINT "chk_fare_rules_rates"
          CHECK ("base_fare_paise" >= 0 AND "per_km_rate_paise" >= 0 AND "tax_rate_bps" >= 0),
        CONSTRAINT "chk_fare_rules_surge"
          CHECK ("surge_multiplier" >= 1.00 AND "surge_multiplier" <= 2.00),
        CONSTRAINT "uq_fare_rules_city_category_version"
          UNIQUE ("city", "service_category", "version")
      );

      CREATE INDEX IF NOT EXISTS "idx_fare_rules_lookup"
        ON "fare_rules" ("city", "service_category", "status", "effective_from");
    `);

    // 2. Create ride_quotes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ride_quotes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "rider_id" UUID,
        "city" VARCHAR(50) NOT NULL,
        "service_category" VARCHAR(50) NOT NULL,
        "pickup_latitude" NUMERIC(9, 6) NOT NULL,
        "pickup_longitude" NUMERIC(9, 6) NOT NULL,
        "dropoff_latitude" NUMERIC(9, 6) NOT NULL,
        "dropoff_longitude" NUMERIC(9, 6) NOT NULL,
        "distance_meters" INT NOT NULL,
        "duration_minutes" INT NOT NULL,
        "waiting_minutes" INT NOT NULL DEFAULT 0,
        "fare_rule_id" UUID NOT NULL REFERENCES "fare_rules"("id") ON DELETE RESTRICT,
        "fare_rule_version" INT NOT NULL,
        "fare_breakdown" JSONB NOT NULL,
        "total_fare_paise" INT NOT NULL,
        "applied_promo_code" VARCHAR(50),
        "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
        "propulsion" VARCHAR(30) NOT NULL DEFAULT 'BATTERY_ELECTRIC',
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "idx_ride_quotes_fare_rule"
        ON "ride_quotes" ("fare_rule_id");
      CREATE INDEX IF NOT EXISTS "idx_ride_quotes_rider"
        ON "ride_quotes" ("rider_id");
    `);

    // 3. Expand bookings table with quote and fare rule traceability
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "quote_id" UUID REFERENCES "ride_quotes"("id") ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "fare_rule_id" UUID REFERENCES "fare_rules"("id") ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "fare_rule_version" INT;
    `);

    // 4. Seed initial regulatory rules:
    // A) Illustrative PDF rule (strictly DRAFT, cannot be live default)
    await queryRunner.query(`
      INSERT INTO "fare_rules" (
        "id", "rule_code", "version", "city", "service_category", "status",
        "base_fare_paise", "base_distance_meters", "per_km_rate_paise", "per_minute_rate_paise",
        "waiting_charge_paise_per_minute", "minimum_fare_paise", "surge_multiplier",
        "tax_rate_bps", "commission_rate_bps", "promotions", "effective_from", "effective_to",
        "is_illustrative", "notes"
      ) VALUES (
        'f0000000-0000-0000-0000-000000000001',
        'VIZAG-4W-ILLUSTRATIVE-DRAFT',
        1,
        'visakhapatnam',
        'CAB_PRIVATE_4W',
        'DRAFT',
        5000, 2000, 1500, 200, 150, 5000, 1.00, 500, 1500, NULL,
        '2026-01-01T00:00:00Z', NULL,
        true,
        'Source PDF illustrative sample - not approved for live operations'
      ) ON CONFLICT ("city", "service_category", "version") DO NOTHING;
    `);

    // B) Authoritative approved pilot rule for Visakhapatnam CITY_COMMUTE_2W
    await queryRunner.query(`
      INSERT INTO "fare_rules" (
        "id", "rule_code", "version", "city", "service_category", "status",
        "base_fare_paise", "base_distance_meters", "per_km_rate_paise", "per_minute_rate_paise",
        "waiting_charge_paise_per_minute", "minimum_fare_paise", "surge_multiplier",
        "tax_rate_bps", "commission_rate_bps", "promotions", "effective_from", "effective_to",
        "is_illustrative", "evidence_reference", "approved_at", "notes"
      ) VALUES (
        'f0000000-0000-0000-0000-000000000002',
        'VIZAG-2W-PILOT-V1',
        1,
        'visakhapatnam',
        'CITY_COMMUTE_2W',
        'ACTIVE',
        2500, 1000, 800, 100, 100, 2500, 1.00, 500, 1500,
        '[{"promoCode": "ECOPILOT", "discountPercent": 10, "maxDiscountPaise": 2000, "validFrom": "2026-01-01T00:00:00Z", "validTo": "2026-12-31T23:59:59Z"}]'::jsonb,
        '2026-01-01T00:00:00Z', NULL,
        false,
        'AP-STA-2026-GO-42-PILOT-CORRIDOR',
        '2026-01-01T00:00:00Z',
        'Gazetted AP State Transport Authority EV Pilot Fare Notification'
      ) ON CONFLICT ("city", "service_category", "version") DO NOTHING;
    `);

    // C) Authoritative approved pilot rule for Visakhapatnam SHARED_SHUTTLE_4W
    await queryRunner.query(`
      INSERT INTO "fare_rules" (
        "id", "rule_code", "version", "city", "service_category", "status",
        "base_fare_paise", "base_distance_meters", "per_km_rate_paise", "per_minute_rate_paise",
        "waiting_charge_paise_per_minute", "minimum_fare_paise", "surge_multiplier",
        "tax_rate_bps", "commission_rate_bps", "promotions", "effective_from", "effective_to",
        "is_illustrative", "evidence_reference", "approved_at", "notes"
      ) VALUES (
        'f0000000-0000-0000-0000-000000000003',
        'VIZAG-SHUTTLE-PILOT-V1',
        1,
        'visakhapatnam',
        'SHARED_SHUTTLE_4W',
        'ACTIVE',
        3500, 2000, 600, 50, 50, 3500, 1.00, 500, 1500,
        NULL,
        '2026-01-01T00:00:00Z', NULL,
        false,
        'AP-STA-2026-GO-43-SHUTTLE',
        '2026-01-01T00:00:00Z',
        'Gazetted AP State Transport Authority Shared Shuttle Pilot Fare Notification'
      ) ON CONFLICT ("city", "service_category", "version") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "fare_rule_version",
        DROP COLUMN IF EXISTS "fare_rule_id",
        DROP COLUMN IF EXISTS "quote_id";
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "ride_quotes";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fare_rules";`);
  }
}
