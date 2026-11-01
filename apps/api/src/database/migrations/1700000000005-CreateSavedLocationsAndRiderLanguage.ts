import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSavedLocationsAndRiderLanguage1700000000005 implements MigrationInterface {
  name = 'CreateSavedLocationsAndRiderLanguage1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add preferred_language to rider_profiles with check constraint ('te', 'en', 'hi')
    await queryRunner.query(`
      ALTER TABLE "rider_profiles"
      ADD COLUMN IF NOT EXISTS "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'te';
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_rider_profiles_language') THEN
          ALTER TABLE "rider_profiles"
          ADD CONSTRAINT "chk_rider_profiles_language" CHECK ("preferred_language" IN ('te', 'en', 'hi'));
        END IF;
      END $$;
    `);

    // 2. Create saved_locations table with PostGIS geometry Point and explicit constraints
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "saved_locations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "label" VARCHAR(50) NOT NULL,
        "address_type" VARCHAR(20) NOT NULL DEFAULT 'BOTH',
        "address_line" VARCHAR(255) NOT NULL,
        "landmark" VARCHAR(100),
        "latitude" NUMERIC(10, 7) NOT NULL,
        "longitude" NUMERIC(10, 7) NOT NULL,
        "location" geometry(Point, 4326),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "chk_saved_locations_type" CHECK ("address_type" IN ('PICKUP', 'DROP', 'BOTH')),
        CONSTRAINT "chk_saved_locations_lat" CHECK ("latitude" >= -90.0 AND "latitude" <= 90.0),
        CONSTRAINT "chk_saved_locations_lng" CHECK ("longitude" >= -180.0 AND "longitude" <= 180.0)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_saved_locations_user_id"
      ON "saved_locations" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_saved_locations_point_gist"
      ON "saved_locations" USING GIST ("location");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_saved_locations_point_gist";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_saved_locations_user_id";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_locations" CASCADE;`);
    await queryRunner.query(`
      ALTER TABLE "rider_profiles" DROP CONSTRAINT IF EXISTS "chk_rider_profiles_language";
    `);
    await queryRunner.query(`
      ALTER TABLE "rider_profiles" DROP COLUMN IF EXISTS "preferred_language";
    `);
  }
}
