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
import { CreateDispatchOutboxEventsTable1700000000021 } from '../src/database/migrations/1700000000021-CreateDispatchOutboxEventsTable';
import { AddRideOtpSafeguardsAndThrottling1700000000022 } from '../src/database/migrations/1700000000022-AddRideOtpSafeguardsAndThrottling';
import { CreatePaymentsAndInvoicesSchema1700000000023 } from '../src/database/migrations/1700000000023-CreatePaymentsAndInvoicesSchema';
import { CreatePayoutBatchesAndItemsSchema1700000000024 } from '../src/database/migrations/1700000000024-CreatePayoutBatchesAndItemsSchema';
import { CreateCorridorSchedulesAndSeatReservationsSchema1700000000025 } from '../src/database/migrations/1700000000025-CreateCorridorSchedulesAndSeatReservationsSchema';
import { CreateCommuterPassesAndRedemptionsSchema1700000000026 } from '../src/database/migrations/1700000000026-CreateCommuterPassesAndRedemptionsSchema';
import { CreateCorporateTransportSchema1700000000027 } from '../src/database/migrations/1700000000027-CreateCorporateTransportSchema';
import { CreateCargoLogisticsSchema1700000000028 } from '../src/database/migrations/1700000000028-CreateCargoLogisticsSchema';
import { CreateChargingAndBatteryTelemetrySchema1700000000029 } from '../src/database/migrations/1700000000029-CreateChargingAndBatteryTelemetrySchema';
import { CreateLoyaltyAndReferralsSchema1700000000030 } from '../src/database/migrations/1700000000030-CreateLoyaltyAndReferralsSchema';
import { CreateSustainabilityAndIncentivesSchema1700000000031 } from '../src/database/migrations/1700000000031-CreateSustainabilityAndIncentivesSchema';
import { CreateDepotsAndMultiModalSchema1700000000032 } from '../src/database/migrations/1700000000032-CreateDepotsAndMultiModalSchema';
import { CreateBatterySwapAndGridTariffsSchema1700000000033 } from '../src/database/migrations/1700000000033-CreateBatterySwapAndGridTariffsSchema';
import { CreateBmsTelemetryAndFleetOwnerSchema1700000000034 } from '../src/database/migrations/1700000000034-CreateBmsTelemetryAndFleetOwnerSchema';
import { CreateOutstationAndCampusShuttleSchema1700000000035 } from '../src/database/migrations/1700000000035-CreateOutstationAndCampusShuttleSchema';
import { CreateDisputesAndDemandForecastSchema1700000000036 } from '../src/database/migrations/1700000000036-CreateDisputesAndDemandForecastSchema';
import { CreateRegulatoryAuditAndVoiceSchema1700000000037 } from '../src/database/migrations/1700000000037-CreateRegulatoryAuditAndVoiceSchema';
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

  describe('CreateDispatchOutboxEventsTable1700000000021', () => {
    let migration: CreateDispatchOutboxEventsTable1700000000021;

    beforeEach(() => {
      migration = new CreateDispatchOutboxEventsTable1700000000021();
    });

    it('should create dispatch_outbox_events table, check constraint, and composite indexes in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "dispatch_outbox_events"');
      expect(allQueries).toContain('chk_dispatch_outbox_events_status');
      expect(allQueries).toContain('idx_dispatch_outbox_events_aggregate');
      expect(allQueries).toContain('idx_dispatch_outbox_events_status_created');
    });

    it('should drop dispatch_outbox_events table in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "dispatch_outbox_events" CASCADE;');
    });
  });

  describe('AddRideOtpSafeguardsAndThrottling1700000000022', () => {
    let migration: AddRideOtpSafeguardsAndThrottling1700000000022;

    beforeEach(() => {
      migration = new AddRideOtpSafeguardsAndThrottling1700000000022();
    });

    it('should add start OTP expiration, throttling, and rotation columns in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('start_otp_expires_at');
      expect(allQueries).toContain('start_otp_failed_attempts');
      expect(allQueries).toContain('start_otp_locked_until');
      expect(allQueries).toContain('start_otp_rotated_at');
      expect(allQueries).toContain('UPDATE "bookings"');
    });

    it('should drop added OTP columns in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP COLUMN IF EXISTS "start_otp_rotated_at"');
      expect(allQueries).toContain('DROP COLUMN IF EXISTS "start_otp_locked_until"');
      expect(allQueries).toContain('DROP COLUMN IF EXISTS "start_otp_failed_attempts"');
      expect(allQueries).toContain('DROP COLUMN IF EXISTS "start_otp_expires_at"');
    });
  });

  describe('CreatePaymentsAndInvoicesSchema1700000000023', () => {
    let migration: CreatePaymentsAndInvoicesSchema1700000000023;

    beforeEach(() => {
      migration = new CreatePaymentsAndInvoicesSchema1700000000023();
    });

    it('should create payment_records and tax_invoices tables and indices in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "payment_records"');
      expect(allQueries).toContain('idx_payment_records_booking');
      expect(allQueries).toContain('idx_payment_records_order');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "tax_invoices"');
      expect(allQueries).toContain('idx_tax_invoices_number');
      expect(allQueries).toContain('idx_tax_invoices_booking');
    });

    it('should drop tax_invoices and payment_records tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "tax_invoices" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "payment_records" CASCADE;');
    });
  });

  describe('CreatePayoutBatchesAndItemsSchema1700000000024', () => {
    let migration: CreatePayoutBatchesAndItemsSchema1700000000024;

    beforeEach(() => {
      migration = new CreatePayoutBatchesAndItemsSchema1700000000024();
    });

    it('should create payout_batches and payout_items tables and indices in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "payout_batches"');
      expect(allQueries).toContain('idx_payout_batches_number');
      expect(allQueries).toContain('idx_payout_batches_status');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "payout_items"');
      expect(allQueries).toContain('idx_payout_items_batch');
      expect(allQueries).toContain('idx_payout_items_recipient');
      expect(allQueries).toContain('idx_payout_items_idempotency');
    });

    it('should drop payout_items and payout_batches tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "payout_items" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "payout_batches" CASCADE;');
    });
  });

  describe('CreateCorridorSchedulesAndSeatReservationsSchema1700000000025', () => {
    let migration: CreateCorridorSchedulesAndSeatReservationsSchema1700000000025;

    beforeEach(() => {
      migration = new CreateCorridorSchedulesAndSeatReservationsSchema1700000000025();
    });

    it('should create corridor routes, schedules, trips, and reservations tables in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corridor_routes"');
      expect(allQueries).toContain('idx_corridor_routes_code');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corridor_schedules"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corridor_trips"');
      expect(allQueries).toContain('uq_corridor_trips_schedule_date');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corridor_seat_reservations"');
      expect(allQueries).toContain('idx_corridor_reservations_pass_code');
    });

    it('should drop all corridor tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corridor_seat_reservations" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corridor_trips" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corridor_schedules" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corridor_routes" CASCADE;');
    });
  });

  describe('CreateCommuterPassesAndRedemptionsSchema1700000000026', () => {
    let migration: CreateCommuterPassesAndRedemptionsSchema1700000000026;

    beforeEach(() => {
      migration = new CreateCommuterPassesAndRedemptionsSchema1700000000026();
    });

    it('should create pass_plans, commuter_passes, and pass_redemptions tables in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "pass_plans"');
      expect(allQueries).toContain('idx_pass_plans_code');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "commuter_passes"');
      expect(allQueries).toContain('idx_commuter_passes_number');
      expect(allQueries).toContain('idx_commuter_passes_rider');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "pass_redemptions"');
      expect(allQueries).toContain('idx_pass_redemptions_pass');
    });

    it('should drop pass_redemptions, commuter_passes, and pass_plans tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "pass_redemptions" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "commuter_passes" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "pass_plans" CASCADE;');
    });
  });

  describe('CreateCorporateTransportSchema1700000000027', () => {
    let migration: CreateCorporateTransportSchema1700000000027;

    beforeEach(() => {
      migration = new CreateCorporateTransportSchema1700000000027();
    });

    it('should create corporate accounts, employees, and manifests tables in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_accounts"');
      expect(allQueries).toContain('idx_corporate_accounts_gstin');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_employees"');
      expect(allQueries).toContain('uq_corp_emp_account_code');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_shift_manifests"');
    });

    it('should drop corporate tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_shift_manifests" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_employees" CASCADE;');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_accounts" CASCADE;');
    });
  });

  describe('CreateCargoLogisticsSchema1700000000028', () => {
    let migration: CreateCargoLogisticsSchema1700000000028;

    beforeEach(() => {
      migration = new CreateCargoLogisticsSchema1700000000028();
    });

    it('should create cargo shipments, stops, and cod settlements in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cargo_shipments"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cargo_stops"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cargo_cod_settlements"');
    });

    it('should drop cargo tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cargo_cod_settlements"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cargo_stops"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cargo_shipments"');
    });
  });

  describe('CreateChargingAndBatteryTelemetrySchema1700000000029', () => {
    let migration: CreateChargingAndBatteryTelemetrySchema1700000000029;

    beforeEach(() => {
      migration = new CreateChargingAndBatteryTelemetrySchema1700000000029();
    });

    it('should create charging stations, reservations, and telemetry logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "charging_stations"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "charging_reservations"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_telemetry_logs"');
    });

    it('should drop charging tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_telemetry_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "charging_reservations"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "charging_stations"');
    });
  });

  describe('CreateLoyaltyAndReferralsSchema1700000000030', () => {
    let migration: CreateLoyaltyAndReferralsSchema1700000000030;

    beforeEach(() => {
      migration = new CreateLoyaltyAndReferralsSchema1700000000030();
    });

    it('should create promo codes and user referrals in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "promo_codes"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "user_referrals"');
      expect(allQueries).toContain('idx_promo_codes_code');
      expect(allQueries).toContain('idx_user_referrals_code');
    });

    it('should drop promo and referral tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "user_referrals"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "promo_codes"');
    });
  });

  describe('CreateSustainabilityAndIncentivesSchema1700000000031', () => {
    let migration: CreateSustainabilityAndIncentivesSchema1700000000031;

    beforeEach(() => {
      migration = new CreateSustainabilityAndIncentivesSchema1700000000031();
    });

    it('should create green certificates, incentive challenges, and captain tier progress in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "green_certificates"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "incentive_challenges"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_tier_progress"');
      expect(allQueries).toContain('idx_green_certs_recipient');
      expect(allQueries).toContain('idx_challenges_active');
    });

    it('should drop sustainability and incentive tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_tier_progress"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "incentive_challenges"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "green_certificates"');
    });
  });

  describe('CreateDepotsAndMultiModalSchema1700000000032', () => {
    let migration: CreateDepotsAndMultiModalSchema1700000000032;

    beforeEach(() => {
      migration = new CreateDepotsAndMultiModalSchema1700000000032();
    });

    it('should create fleet depots, bay allocations, transit hubs, and multimodal tickets in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "fleet_depots"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "depot_bay_allocations"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "transit_hubs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "multi_modal_tickets"');
      expect(allQueries).toContain('idx_fleet_depots_city');
      expect(allQueries).toContain('idx_transit_hubs_city');
    });

    it('should drop depots and multimodal tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "multi_modal_tickets"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "transit_hubs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "depot_bay_allocations"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "fleet_depots"');
    });
  });

  describe('CreateBatterySwapAndGridTariffsSchema1700000000033', () => {
    let migration: CreateBatterySwapAndGridTariffsSchema1700000000033;

    beforeEach(() => {
      migration = new CreateBatterySwapAndGridTariffsSchema1700000000033();
    });

    it('should create battery swap stations, packs, transactions, and grid tariff windows in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_swap_stations"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_packs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_swap_transactions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "grid_tariff_windows"');
      expect(allQueries).toContain('idx_battery_swap_stations_city');
      expect(allQueries).toContain('idx_battery_packs_station');
    });

    it('should drop battery swap and grid tariff tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_swap_transactions"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "grid_tariff_windows"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_packs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_swap_stations"');
    });
  });

  describe('CreateBmsTelemetryAndFleetOwnerSchema1700000000034', () => {
    let migration: CreateBmsTelemetryAndFleetOwnerSchema1700000000034;

    beforeEach(() => {
      migration = new CreateBmsTelemetryAndFleetOwnerSchema1700000000034();
    });

    it('should create vehicle BMS telemetry, alert incidents, lease contracts, and settlements in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "vehicle_bms_telemetry"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "bms_alert_incidents"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "fleet_lease_contracts"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "fleet_owner_settlements"');
      expect(allQueries).toContain('idx_bms_telemetry_vehicle');
    });

    it('should drop BMS telemetry and fleet owner tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "fleet_owner_settlements"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "fleet_lease_contracts"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "bms_alert_incidents"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "vehicle_bms_telemetry"');
    });
  });

  describe('CreateOutstationAndCampusShuttleSchema1700000000035', () => {
    let migration: CreateOutstationAndCampusShuttleSchema1700000000035;

    beforeEach(() => {
      migration = new CreateOutstationAndCampusShuttleSchema1700000000035();
    });

    it('should create outstation routes, trips, and campus geofences in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "outstation_routes"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "outstation_trips"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "campus_geofences"');
      expect(allQueries).toContain('UQ_outstation_routes_code');
      expect(allQueries).toContain('UQ_campus_geofences_code');
    });

    it('should drop outstation and campus tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "campus_geofences"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "outstation_trips"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "outstation_routes"');
    });
  });

  describe('CreateDisputesAndDemandForecastSchema1700000000036', () => {
    let migration: CreateDisputesAndDemandForecastSchema1700000000036;

    beforeEach(() => {
      migration = new CreateDisputesAndDemandForecastSchema1700000000036();
    });

    it('should create customer disputes, lost item reports, demand forecasts, and repositioning orders in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "customer_disputes"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "lost_item_reports"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "zone_demand_forecasts"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "fleet_repositioning_orders"');
      expect(allQueries).toContain('UQ_customer_disputes_ticket');
      expect(allQueries).toContain('UQ_lost_item_reports_report');
    });

    it('should drop disputes, lost items, and forecasting tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "fleet_repositioning_orders"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "zone_demand_forecasts"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "lost_item_reports"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "customer_disputes"');
    });
  });

  describe('CreateRegulatoryAuditAndVoiceSchema1700000000037', () => {
    let migration: CreateRegulatoryAuditAndVoiceSchema1700000000037;

    beforeEach(() => {
      migration = new CreateRegulatoryAuditAndVoiceSchema1700000000037();
    });

    it('should create regulatory audit logs and captain voice preferences in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "regulatory_audit_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_voice_preferences"');
      expect(allQueries).toContain('PK_regulatory_audit_logs_id');
      expect(allQueries).toContain('UQ_captain_voice_preferences_cap');
    });

    it('should drop regulatory audit and voice tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_voice_preferences"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "regulatory_audit_logs"');
    });
  });
});
