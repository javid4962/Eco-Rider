import { EnablePostgisExtension1700000000000 } from '../src/database/migrations/1700000000000-EnablePostgisExtension';
import { CreateInitialSchema1700000000001 } from '../src/database/migrations/1700000000001-CreateInitialSchema';
import { QueryRunner } from 'typeorm';

describe('Database Migrations', () => {
  let mockQueryRunner: Partial<QueryRunner>;
  let executedQueries: string[];

  beforeEach(() => {
    executedQueries = [];
    mockQueryRunner = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        executedQueries.push(sql);
        return [];
      }),
    };
  });

  describe('EnablePostgisExtension1700000000000', () => {
    let migration: EnablePostgisExtension1700000000000;

    beforeEach(() => {
      migration = new EnablePostgisExtension1700000000000();
    });

    it('should enable uuid-ossp and postgis extensions in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      expect(mockQueryRunner.query).toHaveBeenCalledTimes(2);
      expect(executedQueries[0]).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      expect(executedQueries[1]).toContain('CREATE EXTENSION IF NOT EXISTS postgis;');
    });

    it('should drop postgis and uuid-ossp extensions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      expect(mockQueryRunner.query).toHaveBeenCalledTimes(2);
      expect(executedQueries[0]).toContain('DROP EXTENSION IF EXISTS postgis;');
      expect(executedQueries[1]).toContain('DROP EXTENSION IF EXISTS "uuid-ossp";');
    });
  });

  describe('CreateInitialSchema1700000000001', () => {
    let migration: CreateInitialSchema1700000000001;

    beforeEach(() => {
      migration = new CreateInitialSchema1700000000001();
    });

    it('should create initial tables, indexes, and constraints in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      // Verify tables
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "users"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "vehicles"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "zones"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "bookings"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "ledger_entries"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "audit_logs"');

      // Verify constraints
      expect(allQueries).toContain(
        'CONSTRAINT "chk_vehicles_electric_only" CHECK ("propulsion_type" = \'BATTERY_ELECTRIC\')',
      );
      expect(allQueries).toContain(
        'CONSTRAINT "chk_ledger_entry_type" CHECK ("entry_type" IN (\'DEBIT\', \'CREDIT\'))',
      );
      expect(allQueries).toContain(
        'CONSTRAINT "chk_ledger_amount_positive" CHECK ("amount_paise" > 0)',
      );

      // Verify spatial GIST indexes
      expect(allQueries).toContain('USING GIST ("boundary")');
      expect(allQueries).toContain('USING GIST ("pickup_location")');
    });

    it('should drop all created tables in reverse dependency order in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      expect(mockQueryRunner.query).toHaveBeenCalledTimes(6);
      expect(executedQueries[0]).toContain('DROP TABLE IF EXISTS "audit_logs" CASCADE;');
      expect(executedQueries[1]).toContain('DROP TABLE IF EXISTS "ledger_entries" CASCADE;');
      expect(executedQueries[2]).toContain('DROP TABLE IF EXISTS "bookings" CASCADE;');
      expect(executedQueries[3]).toContain('DROP TABLE IF EXISTS "zones" CASCADE;');
      expect(executedQueries[4]).toContain('DROP TABLE IF EXISTS "vehicles" CASCADE;');
      expect(executedQueries[5]).toContain('DROP TABLE IF EXISTS "users" CASCADE;');
    });
  });
});
