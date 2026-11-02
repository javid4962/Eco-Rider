import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicleSeatingConfigurationAndClassificationControls1700000000011 implements MigrationInterface {
  name = 'AddVehicleSeatingConfigurationAndClassificationControls1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add columns for seating configuration, total seating, and service class
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "seating_configuration" VARCHAR(20) NOT NULL DEFAULT 'D+1',
        ADD COLUMN IF NOT EXISTS "total_seating_capacity" INT NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS "service_class" VARCHAR(50) NOT NULL DEFAULT 'ECO_BIKE';
    `);

    // 2. Synchronize existing rows with derived D+X notation, total seats, and service class
    await queryRunner.query(`
      UPDATE "vehicles"
      SET 
        "seating_configuration" = 'D+' || "approved_passenger_seating",
        "total_seating_capacity" = "approved_passenger_seating" + 1,
        "service_class" = CASE
          WHEN "vehicle_category" = 'CITY_COMMUTE_2W' THEN 'ECO_BIKE'
          WHEN "vehicle_category" = 'AUTO_COMMUTE_3W' THEN 'ECO_AUTO'
          WHEN "vehicle_category" = 'CAB_PRIVATE_4W' THEN 'ECO_CAB'
          WHEN "vehicle_category" = 'VAN_COMMUTE_4W' THEN 'ECO_VAN'
          ELSE 'ECO_BIKE'
        END;
    `);

    // 3. Add constraint enforcing driver seat accounting separately
    // Total seating capacity must strictly equal approved customer passenger seating + 1 driver seat
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_seating_driver_separate'
        ) THEN
          ALTER TABLE "vehicles"
            ADD CONSTRAINT "chk_vehicles_seating_driver_separate"
            CHECK ("total_seating_capacity" = "approved_passenger_seating" + 1);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_vehicles_seating_config_format'
        ) THEN
          ALTER TABLE "vehicles"
            ADD CONSTRAINT "chk_vehicles_seating_config_format"
            CHECK ("seating_configuration" ~ '^D[+][0-9]+$');
        END IF;
      END $$;
    `);

    // 4. Create performance indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vehicles_service_class" ON "vehicles" ("service_class");
      CREATE INDEX IF NOT EXISTS "idx_vehicles_seating_config" ON "vehicles" ("seating_configuration");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_vehicles_seating_config";
      DROP INDEX IF EXISTS "idx_vehicles_service_class";
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicles"
        DROP CONSTRAINT IF EXISTS "chk_vehicles_seating_config_format",
        DROP CONSTRAINT IF EXISTS "chk_vehicles_seating_driver_separate",
        DROP COLUMN IF EXISTS "service_class",
        DROP COLUMN IF EXISTS "total_seating_capacity",
        DROP COLUMN IF EXISTS "seating_configuration";
    `);
  }
}
