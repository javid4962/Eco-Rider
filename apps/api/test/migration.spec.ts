import { EnablePostgisExtension1700000000000 } from '../src/database/migrations/1700000000000-EnablePostgisExtension';
import { CreateInitialSchema1700000000001 } from '../src/database/migrations/1700000000001-CreateInitialSchema';
import { CreateIdentityAndRoleSchema1700000000003 } from '../src/database/migrations/1700000000003-CreateIdentityAndRoleSchema';
import { AddSessionTokenRotation1700000000004 } from '../src/database/migrations/1700000000004-AddSessionTokenRotation';
import { CreateSavedLocationsAndRiderLanguage1700000000005 } from '../src/database/migrations/1700000000005-CreateSavedLocationsAndRiderLanguage';
import { CreatePrivacyAndDataDeletionWorkflows1700000000006 } from '../src/database/migrations/1700000000006-CreatePrivacyAndDataDeletionWorkflows';
import { CreateDocumentsSchema1700000000007 } from '../src/database/migrations/1700000000007-CreateDocumentsSchema';
import { ExpandVehiclesTableWithEVCompliance1700000000008 } from '../src/database/migrations/1700000000008-ExpandVehiclesTableWithEVCompliance';
import { CreateCaptainApplicationsAndReviewHistory1700000000009 } from '../src/database/migrations/1700000000009-CreateCaptainApplicationsAndReviewHistory';
import { AddDriverComplianceAndDutyStatus1700000000010 } from '../src/database/migrations/1700000000010-AddDriverComplianceAndDutyStatus';
import { CreateDispatchOffersTable1700000000020 } from '../src/database/migrations/1700000000020-CreateDispatchOffersTable';
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

  describe('CreateIdentityAndRoleSchema1700000000003', () => {
    let migration: CreateIdentityAndRoleSchema1700000000003;

    beforeEach(() => {
      migration = new CreateIdentityAndRoleSchema1700000000003();
    });

    it('should create identity, role, profile, session, consent and audit event tables in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('ALTER TABLE "users"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "email"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "roles"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "rider_profiles"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "driver_profiles"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "consents"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "audit_events"');

      // Verify role scopes seeded
      expect(allQueries).toContain('SUPPORT');
      expect(allQueries).toContain('FINANCE');
      expect(allQueries).toContain('FLEET');
      expect(allQueries).toContain('OPERATOR');
      expect(allQueries).toContain('SUPER_ADMIN');
    });

    it('should drop all identity tables and email column in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "audit_events" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "consents" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "sessions" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "driver_profiles" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "rider_profiles" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "roles" CASCADE;');
      expect(allQueries).toContain('ALTER TABLE "users" DROP COLUMN IF EXISTS "email";');
    });
  });

  describe('AddSessionTokenRotation1700000000004', () => {
    let migration: AddSessionTokenRotation1700000000004;

    beforeEach(() => {
      migration = new AddSessionTokenRotation1700000000004();
    });

    it('should add previous_token_hash column and index in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('ALTER TABLE "sessions"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "previous_token_hash"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_sessions_previous_token_hash"');
    });

    it('should drop index and column in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_sessions_previous_token_hash"');
      expect(allQueries).toContain('ALTER TABLE "sessions"');
      expect(allQueries).toContain('DROP COLUMN IF EXISTS "previous_token_hash"');
    });
  });

  describe('CreateSavedLocationsAndRiderLanguage1700000000005', () => {
    let migration: CreateSavedLocationsAndRiderLanguage1700000000005;

    beforeEach(() => {
      migration = new CreateSavedLocationsAndRiderLanguage1700000000005();
    });

    it('should add preferred_language to rider_profiles and create saved_locations table in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('ALTER TABLE "rider_profiles"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "preferred_language"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "saved_locations"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_saved_locations_user_id"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_saved_locations_point_gist"');
    });

    it('should drop saved_locations table and preferred_language column in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "saved_locations" CASCADE;');
      expect(allQueries).toContain(
        'ALTER TABLE "rider_profiles" DROP COLUMN IF EXISTS "preferred_language";',
      );
    });
  });

  describe('CreatePrivacyAndDataDeletionWorkflows1700000000006', () => {
    let migration: CreatePrivacyAndDataDeletionWorkflows1700000000006;

    beforeEach(() => {
      migration = new CreatePrivacyAndDataDeletionWorkflows1700000000006();
    });

    it('should create data_deletion_requests table and consent optimization index in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "data_deletion_requests"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_deletion_requests_user_id"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_deletion_requests_status"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_consents_user_type_granted"');
    });

    it('should drop data_deletion_requests table and indexes in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_consents_user_type_granted"');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_deletion_requests_status"');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_deletion_requests_user_id"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "data_deletion_requests" CASCADE');
    });
  });

  describe('CreateDocumentsSchema1700000000007', () => {
    let migration: CreateDocumentsSchema1700000000007;

    beforeEach(() => {
      migration = new CreateDocumentsSchema1700000000007();
    });

    it('should create documents table, constraints, and indexes in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "documents"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_documents_user_id"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_documents_storage_key"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_documents_status"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_documents_expires_at"');
    });

    it('should drop documents table and indexes in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_documents_expires_at"');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_documents_status"');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_documents_storage_key"');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_documents_user_id"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "documents" CASCADE');
    });
  });

  describe('ExpandVehiclesTableWithEVCompliance1700000000008', () => {
    let migration: ExpandVehiclesTableWithEVCompliance1700000000008;

    beforeEach(() => {
      migration = new ExpandVehiclesTableWithEVCompliance1700000000008();
    });

    it('should add EV compliance columns, check constraints, and indexes in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('ALTER TABLE "vehicles"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "make"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "approved_passenger_seating"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "rated_range_km"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "range_telemetry_source"');
      expect(allQueries).toContain('ADD COLUMN IF NOT EXISTS "green_plate_verified"');
      expect(allQueries).toContain('chk_vehicles_seating_positive');
      expect(allQueries).toContain('chk_vehicles_rated_range_positive');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_vehicles_owner_id"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_vehicles_verification_status"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_vehicles_city"');
    });

    it('should drop indexes, constraints, and EV columns in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_vehicles_city"');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_vehicles_verification_status"');
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_vehicles_owner_id"');
      expect(allQueries).toContain('DROP CONSTRAINT IF EXISTS "chk_vehicles_rated_range_positive"');
      expect(allQueries).toContain('DROP CONSTRAINT IF EXISTS "chk_vehicles_seating_positive"');
      expect(allQueries).toContain('DROP COLUMN IF EXISTS "make"');
    });
  });

  describe('CreateCaptainApplicationsAndReviewHistory1700000000009', () => {
    let migration: CreateCaptainApplicationsAndReviewHistory1700000000009;

    beforeEach(() => {
      migration = new CreateCaptainApplicationsAndReviewHistory1700000000009();
    });

    it('should create captain_applications and captain_application_reviews tables and indexes in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_applications"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_application_reviews"');
      expect(allQueries).toContain('chk_captain_apps_electric_only');
      expect(allQueries).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "idx_captain_apps_user_id"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_captain_apps_status"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_app_reviews_application_id"');
      expect(allQueries).toContain('CREATE INDEX IF NOT EXISTS "idx_app_reviews_reviewer_id"');
    });

    it('should drop captain_application_reviews and captain_applications tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_application_reviews" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_applications" CASCADE;');
    });
  });

  describe('AddDriverComplianceAndDutyStatus1700000000010', () => {
    let migration: AddDriverComplianceAndDutyStatus1700000000010;

    beforeEach(() => {
      migration = new AddDriverComplianceAndDutyStatus1700000000010();
    });

    it('should add compliance columns, index, and check constraints in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('license_expiry_date');
      expect(allQueries).toContain('duty_status');
      expect(allQueries).toContain('duty_last_toggled_at');
      expect(allQueries).toContain('suspension_reason');
      expect(allQueries).toContain('idx_driver_profiles_duty_status');
      expect(allQueries).toContain('chk_driver_profiles_compliance_status');
      expect(allQueries).toContain('chk_driver_profiles_duty_status');
    });

    it('should revert constraints, index, and columns in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP CONSTRAINT IF EXISTS "chk_driver_profiles_duty_status"');
      expect(allQueries).toContain(
        'DROP CONSTRAINT IF EXISTS "chk_driver_profiles_compliance_status"',
      );
      expect(allQueries).toContain('DROP INDEX IF EXISTS "idx_driver_profiles_duty_status"');
      expect(allQueries).toContain('DROP COLUMN IF EXISTS "license_expiry_date"');
    });
  });

  describe('CreateDispatchOffersTable1700000000020', () => {
    let migration: CreateDispatchOffersTable1700000000020;

    beforeEach(() => {
      migration = new CreateDispatchOffersTable1700000000020();
    });

    it('should create dispatch_offers table, check constraint, and composite indexes in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "dispatch_offers"');
      expect(allQueries).toContain('chk_dispatch_offers_status');
      expect(allQueries).toContain('idx_dispatch_offers_booking_id');
      expect(allQueries).toContain('idx_dispatch_offers_booking_seq');
      expect(allQueries).toContain('idx_dispatch_offers_captain_status');
      expect(allQueries).toContain('idx_dispatch_offers_status_expires');
    });

    it('should drop dispatch_offers table in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "dispatch_offers" CASCADE;');
    });
  });
});
