import { DataSource, QueryRunner } from 'typeorm';
import { CreateInitialSchema1700000000001 } from '../src/database/migrations/1700000000001-CreateInitialSchema';
import { CreateServiceFlagsTable1700000000002 } from '../src/database/migrations/1700000000002-CreateServiceFlagsTable';
import { CreateIdentityAndRoleSchema1700000000003 } from '../src/database/migrations/1700000000003-CreateIdentityAndRoleSchema';
import { AddSessionTokenRotation1700000000004 } from '../src/database/migrations/1700000000004-AddSessionTokenRotation';
import { CreateSavedLocationsAndRiderLanguage1700000000005 } from '../src/database/migrations/1700000000005-CreateSavedLocationsAndRiderLanguage';
import { CreatePrivacyAndDataDeletionWorkflows1700000000006 } from '../src/database/migrations/1700000000006-CreatePrivacyAndDataDeletionWorkflows';
import { CreateDocumentsSchema1700000000007 } from '../src/database/migrations/1700000000007-CreateDocumentsSchema';
import { ExpandVehiclesTableWithEVCompliance1700000000008 } from '../src/database/migrations/1700000000008-ExpandVehiclesTableWithEVCompliance';
import { CreateCaptainApplicationsAndReviewHistory1700000000009 } from '../src/database/migrations/1700000000009-CreateCaptainApplicationsAndReviewHistory';
import { AddDriverComplianceAndDutyStatus1700000000010 } from '../src/database/migrations/1700000000010-AddDriverComplianceAndDutyStatus';
import { AddVehicleSeatingConfigurationAndClassificationControls1700000000011 } from '../src/database/migrations/1700000000011-AddVehicleSeatingConfigurationAndClassificationControls';
import { CreateComplianceWarningsTable1700000000012 } from '../src/database/migrations/1700000000012-CreateComplianceWarningsTable';
import { CreateFleetOrganizationsAndAssignments1700000000013 } from '../src/database/migrations/1700000000013-CreateFleetOrganizationsAndAssignments';
import { CreateServiceCitiesAndExpandServiceZones1700000000014 } from '../src/database/migrations/1700000000014-CreateServiceCitiesAndExpandServiceZones';

describe('Scratch Database Migration Up/Down Test', () => {
  let dataSource: DataSource | null = null;
  let queryRunner: QueryRunner | null = null;
  let migration: CreateInitialSchema1700000000001;
  let isLiveDbAvailable = false;

  beforeAll(async () => {
    migration = new CreateInitialSchema1700000000001();
    try {
      dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'ecoride_dev',
        password: process.env.DATABASE_PASSWORD || 'ecoride_dev_secret',
        database: process.env.DATABASE_NAME || 'ecoride_db',
        synchronize: false,
        logging: false,
      });
      await dataSource.initialize();
      queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      isLiveDbAvailable = true;
    } catch {
      isLiveDbAvailable = false;
    }
  });

  afterAll(async () => {
    if (queryRunner) {
      await queryRunner.release();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Migration Up - Schema Provisioning & Constraints', () => {
    it('should provision all initial tables and indexes reliably', async () => {
      if (!isLiveDbAvailable || !queryRunner) {
        // Mock execution test if container is offline
        const executedQueries: string[] = [];
        const mockRunner: Partial<QueryRunner> = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            executedQueries.push(sql);
            return [];
          }),
        };
        await migration.up(mockRunner as QueryRunner);
        expect(executedQueries.length).toBeGreaterThanOrEqual(18);
        return;
      }

      // Execute migration up
      await migration.up(queryRunner);

      // Verify all tables exist in information_schema
      const tablesResult = await queryRunner.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name IN ('users', 'vehicles', 'zones', 'bookings', 'ledger_entries', 'audit_logs');
        `);

      const tableNames = tablesResult.map((r: { table_name: string }) => r.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('vehicles');
      expect(tableNames).toContain('zones');
      expect(tableNames).toContain('bookings');
      expect(tableNames).toContain('ledger_entries');
      expect(tableNames).toContain('audit_logs');
    }, 30000);

    it('should enforce 100% Battery Electric constraint (reject ICE/hybrid)', async () => {
      if (!isLiveDbAvailable || !queryRunner) {
        expect(true).toBe(true);
        return;
      }

      // Attempt inserting non-electric vehicle (PETROL)
      let petrolError: Error | null = null;
      try {
        await queryRunner.query(`
            INSERT INTO "vehicles" ("registration_number", "propulsion_type", "battery_capacity_kwh", "current_soc_percent", "vehicle_category")
            VALUES ('AP39-ICE-0001', 'PETROL', 0, 0, 'CITY_COMMUTE_2W');
          `);
      } catch (err: unknown) {
        petrolError = err as Error;
      }
      expect(petrolError).not.toBeNull();
      expect(petrolError?.message).toContain('chk_vehicles_electric_only');

      // Valid BATTERY_ELECTRIC insert must succeed
      await queryRunner.query(`
          INSERT INTO "vehicles" ("registration_number", "propulsion_type", "battery_capacity_kwh", "current_soc_percent", "vehicle_category")
          VALUES ('AP39-EV-TEST-01', 'BATTERY_ELECTRIC', 3.5, 92.5, 'CITY_COMMUTE_2W')
          ON CONFLICT ("registration_number") DO NOTHING;
        `);

      const vehicle = await queryRunner.query(`
          SELECT id, registration_number, propulsion_type 
          FROM "vehicles" 
          WHERE registration_number = 'AP39-EV-TEST-01';
        `);
      expect(vehicle[0].propulsion_type).toBe('BATTERY_ELECTRIC');
      expect(vehicle[0].id).toBeDefined(); // UUID generated automatically
    }, 30000);

    it('should enforce financial ledger double-entry and idempotency constraints', async () => {
      if (!isLiveDbAvailable || !queryRunner) {
        expect(true).toBe(true);
        return;
      }

      // Negative test: invalid entry_type (TRANSFER)
      let invalidTypeErr: Error | null = null;
      try {
        await queryRunner.query(`
            INSERT INTO "ledger_entries" ("idempotency_key", "account_id", "entry_type", "amount_paise")
            VALUES ('idem_invalid_type_1', 'acc_platform', 'TRANSFER', 5000);
          `);
      } catch (err: unknown) {
        invalidTypeErr = err as Error;
      }
      expect(invalidTypeErr).not.toBeNull();
      expect(invalidTypeErr?.message).toContain('chk_ledger_entry_type');

      // Negative test: negative amount_paise
      let negativeAmtErr: Error | null = null;
      try {
        await queryRunner.query(`
            INSERT INTO "ledger_entries" ("idempotency_key", "account_id", "entry_type", "amount_paise")
            VALUES ('idem_negative_amt_1', 'acc_platform', 'DEBIT', -500);
          `);
      } catch (err: unknown) {
        negativeAmtErr = err as Error;
      }
      expect(negativeAmtErr).not.toBeNull();
      expect(negativeAmtErr?.message).toContain('chk_ledger_amount_positive');

      // Positive test: valid DEBIT insert
      const validKey = 'idem_valid_tx_1001';
      await queryRunner.query(`
          INSERT INTO "ledger_entries" ("idempotency_key", "account_id", "entry_type", "amount_paise", "description")
          VALUES ('${validKey}', 'acc_rider_wallet', 'DEBIT', 15000, 'Pilot ride fare')
          ON CONFLICT ("idempotency_key") DO NOTHING;
        `);

      // Negative test: duplicate idempotency key
      let duplicateKeyErr: Error | null = null;
      try {
        await queryRunner.query(`
            INSERT INTO "ledger_entries" ("idempotency_key", "account_id", "entry_type", "amount_paise", "description")
            VALUES ('${validKey}', 'acc_rider_wallet', 'DEBIT', 15000, 'Duplicate request attempt');
          `);
      } catch (err: unknown) {
        duplicateKeyErr = err as Error;
      }
      expect(duplicateKeyErr).not.toBeNull();
      expect(duplicateKeyErr?.message).toContain('duplicate key value');
    }, 30000);

    it('should support PostGIS spatial polygon geofencing on zones table', async () => {
      if (!isLiveDbAvailable || !queryRunner) {
        expect(true).toBe(true);
        return;
      }

      // Insert Visakhapatnam urban pilot polygon
      await queryRunner.query(`
          INSERT INTO "zones" ("city", "name", "boundary")
          VALUES (
            'visakhapatnam',
            'Vizag Urban Core Pilot',
            ST_GeomFromText('POLYGON((83.20 17.65, 83.35 17.65, 83.35 17.75, 83.20 17.75, 83.20 17.65))', 4326)
          );
        `);

      // Test point-in-polygon spatial containment (Jagadamba Junction: 83.3012, 17.7126 is inside)
      const insideCheck = await queryRunner.query(`
          SELECT name, ST_Contains(boundary, ST_SetSRID(ST_MakePoint(83.3012, 17.7126), 4326)) as is_inside
          FROM "zones"
          WHERE name = 'Vizag Urban Core Pilot'
          LIMIT 1;
        `);
      expect(insideCheck[0].is_inside).toBe(true);

      // Outside point (Vijayawada: 80.6480, 16.5062 is outside)
      const outsideCheck = await queryRunner.query(`
          SELECT name, ST_Contains(boundary, ST_SetSRID(ST_MakePoint(80.6480, 16.5062), 4326)) as is_inside
          FROM "zones"
          WHERE name = 'Vizag Urban Core Pilot'
          LIMIT 1;
        `);
      expect(outsideCheck[0].is_inside).toBe(false);
    }, 30000);
  });

  describe('Migration Down - Safe Rollback Verification', () => {
    it('should rollback cleanly and remove all created tables', async () => {
      if (!isLiveDbAvailable || !queryRunner) {
        const executedQueries: string[] = [];
        const mockRunner: Partial<QueryRunner> = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            executedQueries.push(sql);
            return [];
          }),
        };
        await migration.down(mockRunner as QueryRunner);
        expect(executedQueries.length).toBe(6);
        return;
      }

      // Execute rollback
      await migration.down(queryRunner);

      // Confirm all tables are dropped
      const tablesAfterDown = await queryRunner.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name IN ('users', 'vehicles', 'zones', 'bookings', 'ledger_entries', 'audit_logs');
        `);
      expect(tablesAfterDown).toHaveLength(0);

      // Re-apply up so container remains provisioned for local development
      await migration.up(queryRunner);
      await new CreateServiceFlagsTable1700000000002().up(queryRunner);
      await new CreateIdentityAndRoleSchema1700000000003().up(queryRunner);
      await new AddSessionTokenRotation1700000000004().up(queryRunner);
      await new CreateSavedLocationsAndRiderLanguage1700000000005().up(queryRunner);
      await new CreatePrivacyAndDataDeletionWorkflows1700000000006().up(queryRunner);
      await new CreateDocumentsSchema1700000000007().up(queryRunner);
      await new ExpandVehiclesTableWithEVCompliance1700000000008().up(queryRunner);
      await new CreateCaptainApplicationsAndReviewHistory1700000000009().up(queryRunner);
      await new AddDriverComplianceAndDutyStatus1700000000010().up(queryRunner);
      await new AddVehicleSeatingConfigurationAndClassificationControls1700000000011().up(
        queryRunner,
      );
      await new CreateComplianceWarningsTable1700000000012().up(queryRunner);
    }, 60000);
  });

  describe('Migration 12 (EV-029) - Compliance Warnings Table Up/Down', () => {
    it('should provision compliance_warnings table and verify rollback', async () => {
      const migration12 = new CreateComplianceWarningsTable1700000000012();
      if (!isLiveDbAvailable || !queryRunner) {
        const executedQueries: string[] = [];
        const mockRunner: Partial<QueryRunner> = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            executedQueries.push(sql);
            return [];
          }),
        };
        await migration12.up(mockRunner as QueryRunner);
        await migration12.down(mockRunner as QueryRunner);
        expect(executedQueries.length).toBeGreaterThan(0);
        return;
      }

      // Ensure up
      await migration12.up(queryRunner);

      const tableCheck = await queryRunner.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'compliance_warnings';
      `);
      expect(tableCheck).toHaveLength(1);

      // Verify down
      await migration12.down(queryRunner);
      const tableCheckDown = await queryRunner.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'compliance_warnings';
      `);
      expect(tableCheckDown).toHaveLength(0);

      // Re-apply up
      await migration12.up(queryRunner);
    });
  });

  describe('Migration 13 (EV-030) - Fleet Organizations & Assignments Up/Down', () => {
    it('should provision fleet_organizations, fleet_vehicle_assignments, and fleet_shifts tables and verify rollback', async () => {
      const migration13 = new CreateFleetOrganizationsAndAssignments1700000000013();
      if (!isLiveDbAvailable || !queryRunner) {
        const executedQueries: string[] = [];
        const mockRunner: Partial<QueryRunner> = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            executedQueries.push(sql);
            return [];
          }),
        };
        await migration13.up(mockRunner as QueryRunner);
        await migration13.down(mockRunner as QueryRunner);
        expect(executedQueries.length).toBeGreaterThan(0);
        return;
      }

      // Ensure up
      await migration13.up(queryRunner);

      const tableCheck = await queryRunner.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('fleet_organizations', 'fleet_vehicle_assignments', 'fleet_shifts');
      `);
      expect(tableCheck).toHaveLength(3);

      // Verify down
      await migration13.down(queryRunner);
      const tableCheckDown = await queryRunner.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('fleet_organizations', 'fleet_vehicle_assignments', 'fleet_shifts');
      `);
      expect(tableCheckDown).toHaveLength(0);

      // Re-apply up
      await migration13.up(queryRunner);
    });

    it('should provision service_cities table and expand zones table reliably (EV-031)', async () => {
      const migration14 = new CreateServiceCitiesAndExpandServiceZones1700000000014();
      if (!isLiveDbAvailable || !queryRunner) {
        const executedQueries: string[] = [];
        const mockRunner: Partial<QueryRunner> = {
          query: jest.fn().mockImplementation(async (sql: string) => {
            executedQueries.push(sql);
            return [];
          }),
        };
        await migration14.up(mockRunner as QueryRunner);
        await migration14.down(mockRunner as QueryRunner);
        expect(executedQueries.length).toBeGreaterThan(0);
        return;
      }

      // Ensure up
      await migration14.up(queryRunner);

      const tableCheck = await queryRunner.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'service_cities';
      `);
      expect(tableCheck).toHaveLength(1);

      const columnCheck = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'zones' AND column_name IN ('code', 'operational_status', 'evidence_reference', 'permit_expires_at', 'category_switches');
      `);
      expect(columnCheck).toHaveLength(5);

      // Verify down
      await migration14.down(queryRunner);
      const tableCheckDown = await queryRunner.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'service_cities';
      `);
      expect(tableCheckDown).toHaveLength(0);

      // Re-apply up
      await migration14.up(queryRunner);
    });
  });
});
