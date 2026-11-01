import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdentityAndRoleSchema1700000000003 implements MigrationInterface {
  name = 'CreateIdentityAndRoleSchema1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add email column to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "email" VARCHAR(150) UNIQUE;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
    `);

    // 2. Roles table & seed system roles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" VARCHAR(50) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "scopes" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "is_system" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default system roles
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "name", "description", "scopes", "is_system")
      VALUES
        ('RIDER', 'Rider Commuter', 'Standard EV commuter rider account', '["rider:self", "booking:create", "booking:read:self", "consent:write:self"]'::jsonb, true),
        ('CAPTAIN', 'EV Driver Partner', 'Authorized EV pilot captain in Andhra Pradesh', '["driver:self", "shift:manage:self", "telemetry:emit:self", "booking:accept:self"]'::jsonb, true),
        ('SUPPORT', 'Support Specialist', 'Customer and driver support agent with read-only access', '["rider:read", "driver:read", "booking:read", "session:read", "consent:read", "audit:read"]'::jsonb, true),
        ('FINANCE', 'Finance Administrator', 'Finance, revenue settlements, and driver payout management', '["finance:read", "finance:write", "ledger:read", "payout:manage", "audit:read"]'::jsonb, true),
        ('FLEET', 'Fleet Operations Manager', 'EV battery health, charging depot allocation, and vehicle management', '["fleet:read", "fleet:write", "vehicle:manage", "telemetry:read", "depot:manage"]'::jsonb, true),
        ('OPERATOR', 'City Dispatch Operator', 'Live dispatch oversight, geofenced zone status, and service category toggles', '["dispatch:manage", "zone:manage", "driver:shift", "service:toggle", "booking:read"]'::jsonb, true),
        ('SUPER_ADMIN', 'Platform Super Administrator', 'Full platform governance, role assignment, and audit oversight', '["*"]'::jsonb, true),
        ('DISPATCHER', 'Dispatcher Partner', 'Zone dispatch operator alias', '["dispatch:manage", "zone:read", "driver:read", "booking:read"]'::jsonb, true),
        ('FINANCE_ADMIN', 'Finance Admin Partner', 'Finance admin alias', '["finance:read", "finance:write", "ledger:read", "payout:manage"]'::jsonb, true),
        ('SAFETY_OFFICER', 'Safety Response Officer', '24x7 safety and emergency incident response', '["safety:audit", "driver:read", "incident:manage", "audit:read"]'::jsonb, true),
        ('FLEET_OWNER', 'Fleet Owner Partner', 'Commercial EV fleet partner', '["fleet:read", "vehicle:read"]'::jsonb, true),
        ('INSTITUTION_REP', 'Institutional Partner', 'Corporate/university mobility representative', '["institution:manage", "pass:read"]'::jsonb, true)
      ON CONFLICT ("id") DO UPDATE
      SET "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "scopes" = EXCLUDED."scopes",
          "updated_at" = NOW();
    `);

    // 3. Rider Profiles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rider_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "emergency_contact_name" VARCHAR(100),
        "emergency_contact_phone" VARCHAR(20),
        "preferred_payment_mode" VARCHAR(50) NOT NULL DEFAULT 'CASH_OR_UPI',
        "default_pickup_notes" TEXT,
        "accessibility_needs" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_rider_profiles_user_id" ON "rider_profiles" ("user_id");
    `);

    // 4. Driver Profiles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "driver_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "license_number" VARCHAR(50) NOT NULL UNIQUE,
        "badge_number" VARCHAR(50),
        "verification_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "green_plate_permit_verified" BOOLEAN NOT NULL DEFAULT false,
        "safety_training_completed" BOOLEAN NOT NULL DEFAULT false,
        "city" VARCHAR(50) NOT NULL DEFAULT 'visakhapatnam',
        "assigned_vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL,
        "rating_average" NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
        "total_trips" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_driver_profiles_user_id" ON "driver_profiles" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_driver_profiles_license" ON "driver_profiles" ("license_number");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_driver_profiles_status" ON "driver_profiles" ("verification_status");
    `);

    // 5. Sessions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" VARCHAR(128) NOT NULL UNIQUE,
        "device_id" VARCHAR(100),
        "platform" VARCHAR(30) NOT NULL DEFAULT 'WEB',
        "ip_address" VARCHAR(45),
        "user_agent" VARCHAR(255),
        "is_revoked" BOOLEAN NOT NULL DEFAULT false,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_token_hash" ON "sessions" ("token_hash");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_is_revoked" ON "sessions" ("is_revoked");
    `);

    // 6. Consents table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consents" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "consent_type" VARCHAR(50) NOT NULL,
        "consent_version" VARCHAR(20) NOT NULL,
        "is_granted" BOOLEAN NOT NULL DEFAULT true,
        "ip_address" VARCHAR(45),
        "user_agent" VARCHAR(255),
        "granted_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "revoked_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_user_consent_type_version" UNIQUE ("user_id", "consent_type", "consent_version")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consents_user_id" ON "consents" ("user_id");
    `);

    // 7. Audit Events table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_events" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "actor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "target_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "action" VARCHAR(100) NOT NULL,
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id" VARCHAR(100) NOT NULL,
        "previous_state" JSONB,
        "new_state" JSONB,
        "ip_address" VARCHAR(45),
        "correlation_id" VARCHAR(100),
        "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
        "failure_reason" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_events_actor" ON "audit_events" ("actor_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_events_target_user" ON "audit_events" ("target_user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_events_action" ON "audit_events" ("action");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_events_created" ON "audit_events" ("created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_events" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consents" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "driver_profiles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rider_profiles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE;`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "email";`);
  }
}
