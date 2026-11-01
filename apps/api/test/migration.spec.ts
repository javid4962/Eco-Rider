import { EnablePostgisExtension1700000000000 } from '../src/database/migrations/1700000000000-EnablePostgisExtension';
import { QueryRunner } from 'typeorm';

describe('EnablePostgisExtension Migration', () => {
  let migration: EnablePostgisExtension1700000000000;
  let mockQueryRunner: Partial<QueryRunner>;
  let executedQueries: string[];

  beforeEach(() => {
    migration = new EnablePostgisExtension1700000000000();
    executedQueries = [];
    mockQueryRunner = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        executedQueries.push(sql);
        return [];
      }),
    };
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

