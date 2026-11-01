import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionTokenRotation1700000000004 implements MigrationInterface {
  name = 'AddSessionTokenRotation1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "previous_token_hash" VARCHAR(128);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sessions_previous_token_hash"
      ON "sessions" ("previous_token_hash");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_sessions_previous_token_hash";
    `);
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "previous_token_hash";
    `);
  }
}
