import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceFlagsTable1700000000002 implements MigrationInterface {
  name = 'CreateServiceFlagsTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_flags" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "city" VARCHAR(50) NOT NULL,
        "service_category" VARCHAR(50) NOT NULL,
        "is_enabled" BOOLEAN NOT NULL DEFAULT false,
        "release_phase" VARCHAR(50) NOT NULL,
        "blocker_reason" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_service_flags_city_category" UNIQUE ("city", "service_category")
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_service_flags_city" ON "service_flags" ("city");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_service_flags_category" ON "service_flags" ("service_category");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service_flags" CASCADE;`);
  }
}

