import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCaptainApplicationsAndReviewHistory1700000000009 implements MigrationInterface {
  name = 'CreateCaptainApplicationsAndReviewHistory1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_applications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        
        -- Driver requirements
        "driver_requirements_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "driver_rejection_reason" TEXT,
        "full_name" VARCHAR(150),
        "date_of_birth" DATE,
        "driving_license_number" VARCHAR(50),
        "driving_license_expiry" TIMESTAMPTZ,
        "badge_number" VARCHAR(50),
        "emergency_contact_name" VARCHAR(100),
        "emergency_contact_phone" VARCHAR(20),
        "driving_license_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "aadhaar_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "pan_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "police_verification_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "profile_photo_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,

        -- Vehicle requirements
        "vehicle_requirements_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "vehicle_rejection_reason" TEXT,
        "vehicle_ownership_type" VARCHAR(30) NOT NULL DEFAULT 'OWNED',
        "vehicle_category" VARCHAR(50) NOT NULL DEFAULT 'CITY_COMMUTE_2W',
        "propulsion_type" VARCHAR(30) NOT NULL DEFAULT 'BATTERY_ELECTRIC',
        "vehicle_make" VARCHAR(100),
        "vehicle_model" VARCHAR(100),
        "vehicle_year" INT,
        "vehicle_registration_number" VARCHAR(30),
        "battery_capacity_kwh" NUMERIC(6, 2),
        "vehicle_rc_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "green_plate_permit_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "insurance_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "fitness_doc_id" UUID REFERENCES "documents"("id") ON DELETE SET NULL,
        "created_vehicle_id" UUID REFERENCES "vehicles"("id") ON DELETE SET NULL,

        -- Operational metadata
        "city" VARCHAR(50) NOT NULL DEFAULT 'visakhapatnam',
        "submission_count" INT NOT NULL DEFAULT 0,
        "submitted_at" TIMESTAMPTZ,
        "reviewed_at" TIMESTAMPTZ,
        "last_reviewer_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "overall_rejection_reason" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT "chk_captain_apps_electric_only" CHECK ("propulsion_type" = 'BATTERY_ELECTRIC')
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_captain_apps_user_id" ON "captain_applications" ("user_id");
      CREATE INDEX IF NOT EXISTS "idx_captain_apps_status" ON "captain_applications" ("status");
      CREATE INDEX IF NOT EXISTS "idx_captain_apps_city" ON "captain_applications" ("city");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "captain_application_reviews" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "application_id" UUID NOT NULL REFERENCES "captain_applications"("id") ON DELETE CASCADE,
        "reviewer_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "previous_status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        "new_status" VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
        "driver_requirements_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "driver_rejection_reason" TEXT,
        "vehicle_requirements_status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "vehicle_rejection_reason" TEXT,
        "notes" TEXT,
        "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_app_reviews_application_id" ON "captain_application_reviews" ("application_id");
      CREATE INDEX IF NOT EXISTS "idx_app_reviews_reviewer_id" ON "captain_application_reviews" ("reviewer_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "captain_application_reviews" CASCADE;
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "captain_applications" CASCADE;
    `);
  }
}
