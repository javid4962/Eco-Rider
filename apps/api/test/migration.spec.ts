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
import { CreateEmergencyRescueAndSmartChargingSchema1700000000038 } from '../src/database/migrations/1700000000038-CreateEmergencyRescueAndSmartChargingSchema';
import { CreateDriverFatigueAndCarbonTokensSchema1700000000039 } from '../src/database/migrations/1700000000039-CreateDriverFatigueAndCarbonTokensSchema';
import { CreateFreightManifestAndHighwayTollSchema1700000000040 } from '../src/database/migrations/1700000000040-CreateFreightManifestAndHighwayTollSchema';
import { CreateCorporateSubsidyAndColdChainSchema1700000000041 } from '../src/database/migrations/1700000000041-CreateCorporateSubsidyAndColdChainSchema';
import { CreateDriverMicrofinanceAndWeatherPricingSchema1700000000042 } from '../src/database/migrations/1700000000042-CreateDriverMicrofinanceAndWeatherPricingSchema';
import { CreateBatteryDegradationAndMicroGeofenceSchema1700000000043 } from '../src/database/migrations/1700000000043-CreateBatteryDegradationAndMicroGeofenceSchema';
import { CreateMultiPartySplitAndSpeedGovernorSchema1700000000044 } from '../src/database/migrations/1700000000044-CreateMultiPartySplitAndSpeedGovernorSchema';
import { CreateScope3EsgAndCaptainWelfareSchema1700000000045 } from '../src/database/migrations/1700000000045-CreateScope3EsgAndCaptainWelfareSchema';
import { CreateTransitNfcAndFleetMaintenanceSchema1700000000046 } from '../src/database/migrations/1700000000046-CreateTransitNfcAndFleetMaintenanceSchema';
import { CreateInteractiveVoiceAndDrReplicationSchema1700000000047 } from '../src/database/migrations/1700000000047-CreateInteractiveVoiceAndDrReplicationSchema';
import { CreateV2gAndSmartLockersSchema1700000000048 } from '../src/database/migrations/1700000000048-CreateV2gAndSmartLockersSchema';
import { CreateBiometricWellnessAndCleanEnergyRoutingSchema1700000000049 } from '../src/database/migrations/1700000000049-CreateBiometricWellnessAndCleanEnergyRoutingSchema';
import { CreateHighwayFastChargingAndCaptainPensionSchema1700000000050 } from '../src/database/migrations/1700000000050-CreateHighwayFastChargingAndCaptainPensionSchema';
import { CreateLostFoundCustodyAndDepotLoadBalancingSchema1700000000051 } from '../src/database/migrations/1700000000051-CreateLostFoundCustodyAndDepotLoadBalancingSchema';
import { CreateZeroEmissionZonesAndEmergencyIslandingSchema1700000000052 } from '../src/database/migrations/1700000000052-CreateZeroEmissionZonesAndEmergencyIslandingSchema';
import { CreateCaptainMentorshipAndCongestionZonesSchema1700000000053 } from '../src/database/migrations/1700000000053-CreateCaptainMentorshipAndCongestionZonesSchema';
import { CreateColdChainInsuranceAndAirportFeederSchema1700000000054 } from '../src/database/migrations/1700000000054-CreateColdChainInsuranceAndAirportFeederSchema';
import { CreateDriverFatigueAndDigitalPermitsSchema1700000000055 } from '../src/database/migrations/1700000000055-CreateDriverFatigueAndDigitalPermitsSchema';
import { CreateCorporateApprovalsAndAis156SwapSchema1700000000056 } from '../src/database/migrations/1700000000056-CreateCorporateApprovalsAndAis156SwapSchema';
import { CreateV2vRescueAndCycloneRelocationSchema1700000000057 } from '../src/database/migrations/1700000000057-CreateV2vRescueAndCycloneRelocationSchema';
import { CreateBessAndEwayBillSchema1700000000058 } from '../src/database/migrations/1700000000058-CreateBessAndEwayBillSchema';
import { CreateCaptainAcademyAndAvasTelemetrySchema1700000000059 } from '../src/database/migrations/1700000000059-CreateCaptainAcademyAndAvasTelemetrySchema';
import { CreateParcelRelayAndMicroMobilitySchema1700000000060 } from '../src/database/migrations/1700000000060-CreateParcelRelayAndMicroMobilitySchema';
import { CreateCarbonCreditAndPanicAudioSchema1700000000061 } from '../src/database/migrations/1700000000061-CreateCarbonCreditAndPanicAudioSchema';
import { CreateCampusLoopAndPredictiveTireSchema1700000000062 } from '../src/database/migrations/1700000000062-CreateCampusLoopAndPredictiveTireSchema';
import { CreateBatterySecondLifeAndTransitTurnstileSchema1700000000063 } from '../src/database/migrations/1700000000063-CreateBatterySecondLifeAndTransitTurnstileSchema';
import { CreateHighwayRestStopAndGridCurtailmentSchema1700000000064 } from '../src/database/migrations/1700000000064-CreateHighwayRestStopAndGridCurtailmentSchema';
import { CreateCorporateGreenAndReeferTelematicsSchema1700000000065 } from '../src/database/migrations/1700000000065-CreateCorporateGreenAndReeferTelematicsSchema';
import { CreateMicroMobilityBountyAndAqiMonitoringSchema1700000000066 } from '../src/database/migrations/1700000000066-CreateMicroMobilityBountyAndAqiMonitoringSchema';
import { CreateMonsoonTractionAndOccPostureSchema1700000000067 } from '../src/database/migrations/1700000000067-CreateMonsoonTractionAndOccPostureSchema';
import { CreateFloodDepthAndCaptainErgonomicsSchema1700000000068 } from '../src/database/migrations/1700000000068-CreateFloodDepthAndCaptainErgonomicsSchema';
import { CreateSolarCanopyAndCostCenterSchema1700000000069 } from '../src/database/migrations/1700000000069-CreateSolarCanopyAndCostCenterSchema';
import { CreateLockboxAndPedestrianZoneSchema1700000000070 } from '../src/database/migrations/1700000000070-CreateLockboxAndPedestrianZoneSchema';
import { CreateCaptainEcoAndDisasterMobilizationSchema1700000000071 } from '../src/database/migrations/1700000000071-CreateCaptainEcoAndDisasterMobilizationSchema';
import { CreateV2hResidentialAndExecutiveKpiSchema1700000000072 } from '../src/database/migrations/1700000000072-CreateV2hResidentialAndExecutiveKpiSchema';
import { CreateSolarDepotAndFreightHashSchema1700000000073 } from '../src/database/migrations/1700000000073-CreateSolarDepotAndFreightHashSchema';
import { CreateFeederDiscountAndCableThermalSchema1700000000074 } from '../src/database/migrations/1700000000074-CreateFeederDiscountAndCableThermalSchema';
import { CreateCorporateOccupancyAndMultipathGpsSchema1700000000075 } from '../src/database/migrations/1700000000075-CreateCorporateOccupancyAndMultipathGpsSchema';
import { CreateRainCoverAndSmartDepotSchema1700000000076 } from '../src/database/migrations/1700000000076-CreateRainCoverAndSmartDepotSchema';
import { CreateNcmcPaymentAndFleetRebalancingSchema1700000000077 } from '../src/database/migrations/1700000000077-CreateNcmcPaymentAndFleetRebalancingSchema';
import { CreatePantographAndWeatherGovernorSchema1700000000078 } from '../src/database/migrations/1700000000078-CreatePantographAndWeatherGovernorSchema';
import { CreateBmsWarrantyAndTspRoutingSchema1700000000079 } from '../src/database/migrations/1700000000079-CreateBmsWarrantyAndTspRoutingSchema';
import { CreateDepotGateAndTaxCertificateSchema1700000000080 } from '../src/database/migrations/1700000000080-CreateDepotGateAndTaxCertificateSchema';
import { CreateVernacularDetourAndAntiRollbackSchema1700000000081 } from '../src/database/migrations/1700000000081-CreateVernacularDetourAndAntiRollbackSchema';
import { CreateOcpiRoamingAndOccPttSchema1700000000082 } from '../src/database/migrations/1700000000082-CreateOcpiRoamingAndOccPttSchema';
import { CreateCrashImpactAndRuralAgriCargoSchema1700000000083 } from '../src/database/migrations/1700000000083-CreateCrashImpactAndRuralAgriCargoSchema';
import { CreateRegenHarvestAndCellDiagnosticSchema1700000000084 } from '../src/database/migrations/1700000000084-CreateRegenHarvestAndCellDiagnosticSchema';
import { CreateChargingHostRevenueAndSolarMpptSchema1700000000085 } from '../src/database/migrations/1700000000085-CreateChargingHostRevenueAndSolarMpptSchema';
import { CreateFloodEvacuationAndWheelAlignmentSchema1700000000086 } from '../src/database/migrations/1700000000086-CreateFloodEvacuationAndWheelAlignmentSchema';
import { CreateRoboticSwapAndGreenBondAuditSchema1700000000087 } from '../src/database/migrations/1700000000087-CreateRoboticSwapAndGreenBondAuditSchema';
import { CreateGridPeakTariffAndFleetSubLeaseSchema1700000000088 } from '../src/database/migrations/1700000000088-CreateGridPeakTariffAndFleetSubLeaseSchema';
import { CreateSpeedGovernorGeofenceAndDepotInventorySchema1700000000089 } from '../src/database/migrations/1700000000089-CreateSpeedGovernorGeofenceAndDepotInventorySchema';
import { CreateInterStatePermitAndBmsArcFlashSchema1700000000090 } from '../src/database/migrations/1700000000090-CreateInterStatePermitAndBmsArcFlashSchema';
import { CreateVernacularVoicePromptAndScope3CarbonSchema1700000000091 } from '../src/database/migrations/1700000000091-CreateVernacularVoicePromptAndScope3CarbonSchema';
import { CreateBatterySecondLifeAuctionAndIntercityTransitSchema1700000000092 } from '../src/database/migrations/1700000000092-CreateBatterySecondLifeAuctionAndIntercityTransitSchema';
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

  describe('CreateEmergencyRescueAndSmartChargingSchema1700000000038', () => {
    let migration: CreateEmergencyRescueAndSmartChargingSchema1700000000038;

    beforeEach(() => {
      migration = new CreateEmergencyRescueAndSmartChargingSchema1700000000038();
    });

    it('should create rescue units, rescue requests, transformer loads, and smart charging profiles in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "rescue_units"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "rescue_requests"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "transformer_station_loads"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "smart_charging_profiles"');
      expect(allQueries).toContain('UQ_rescue_units_code');
      expect(allQueries).toContain('UQ_rescue_requests_ticket');
    });

    it('should drop emergency rescue and smart charging tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "smart_charging_profiles"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "transformer_station_loads"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "rescue_requests"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "rescue_units"');
    });
  });

  describe('CreateDriverFatigueAndCarbonTokensSchema1700000000039', () => {
    let migration: CreateDriverFatigueAndCarbonTokensSchema1700000000039;

    beforeEach(() => {
      migration = new CreateDriverFatigueAndCarbonTokensSchema1700000000039();
    });

    it('should create driver duty logs, carbon wallets, and reward redemptions in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "driver_duty_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "carbon_token_wallets"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "carbon_reward_redemptions"');
      expect(allQueries).toContain('UQ_carbon_token_wallets_user');
      expect(allQueries).toContain('UQ_carbon_reward_redemptions_code');
    });

    it('should drop driver fatigue and carbon tokens tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "carbon_reward_redemptions"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "carbon_token_wallets"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "driver_duty_logs"');
    });
  });

  describe('CreateFreightManifestAndHighwayTollSchema1700000000040', () => {
    let migration: CreateFreightManifestAndHighwayTollSchema1700000000040;

    beforeEach(() => {
      migration = new CreateFreightManifestAndHighwayTollSchema1700000000040();
    });

    it('should create freight manifests, toll plazas, and toll crossings in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "freight_manifests"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "toll_plazas"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "toll_crossings"');
      expect(allQueries).toContain('UQ_freight_manifests_number');
      expect(allQueries).toContain('UQ_toll_plazas_code');
      expect(allQueries).toContain('UQ_toll_crossings_fastag');
    });

    it('should drop freight manifests and highway toll tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "toll_crossings"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "toll_plazas"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "freight_manifests"');
    });
  });

  describe('CreateCorporateSubsidyAndColdChainSchema1700000000041', () => {
    let migration: CreateCorporateSubsidyAndColdChainSchema1700000000041;

    beforeEach(() => {
      migration = new CreateCorporateSubsidyAndColdChainSchema1700000000041();
    });

    it('should create corporate subsidy policies, claims, cold chain shipments, and logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_subsidy_policies"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "employee_subsidy_claims"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cold_chain_shipments"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cold_chain_telemetry_logs"');
      expect(allQueries).toContain('UQ_cold_chain_shipments_consignment');
    });

    it('should drop corporate subsidy and cold chain tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cold_chain_telemetry_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cold_chain_shipments"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "employee_subsidy_claims"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_subsidy_policies"');
    });
  });

  describe('CreateDriverMicrofinanceAndWeatherPricingSchema1700000000042', () => {
    let migration: CreateDriverMicrofinanceAndWeatherPricingSchema1700000000042;

    beforeEach(() => {
      migration = new CreateDriverMicrofinanceAndWeatherPricingSchema1700000000042();
    });

    it('should create captain emi plans, deduction records, and weather logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_emi_plans"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "emi_deduction_records"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "weather_condition_logs"');
      expect(allQueries).toContain('UQ_captain_emi_plans_loan');
    });

    it('should drop driver microfinance and weather logs tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "weather_condition_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "emi_deduction_records"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_emi_plans"');
    });
  });

  describe('CreateBatteryDegradationAndMicroGeofenceSchema1700000000043', () => {
    let migration: CreateBatteryDegradationAndMicroGeofenceSchema1700000000043;

    beforeEach(() => {
      migration = new CreateBatteryDegradationAndMicroGeofenceSchema1700000000043();
    });

    it('should create battery degradation, BESS repurposing, and municipal geofence tables in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_degradation_records"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "bess_repurposing_orders"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "municipal_micro_geofences"');
      expect(allQueries).toContain('UQ_bess_repurposing_orders_num');
    });

    it('should drop battery degradation and micro geofence tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "municipal_micro_geofences"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "bess_repurposing_orders"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_degradation_records"');
    });
  });

  describe('CreateMultiPartySplitAndSpeedGovernorSchema1700000000044', () => {
    let migration: CreateMultiPartySplitAndSpeedGovernorSchema1700000000044;

    beforeEach(() => {
      migration = new CreateMultiPartySplitAndSpeedGovernorSchema1700000000044();
    });

    it('should create split payout batches, items, and speed zones in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "split_payout_batches"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "split_payout_items"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "speed_limit_zones"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "speed_violation_incidents"');
      expect(allQueries).toContain('UQ_speed_limit_zones_code');
    });

    it('should drop split payout and speed governor tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "speed_violation_incidents"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "speed_limit_zones"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "split_payout_items"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "split_payout_batches"');
    });
  });

  describe('CreateScope3EsgAndCaptainWelfareSchema1700000000045', () => {
    let migration: CreateScope3EsgAndCaptainWelfareSchema1700000000045;

    beforeEach(() => {
      migration = new CreateScope3EsgAndCaptainWelfareSchema1700000000045();
    });

    it('should create scope3 reports, welfare ledger, and medical claims in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_scope3_reports"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_welfare_ledger"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "medical_claims"');
      expect(allQueries).toContain('UQ_medical_claims_num');
    });

    it('should drop scope3 and welfare tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "medical_claims"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_welfare_ledger"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_scope3_reports"');
    });
  });

  describe('CreateTransitNfcAndFleetMaintenanceSchema1700000000046', () => {
    let migration: CreateTransitNfcAndFleetMaintenanceSchema1700000000046;

    beforeEach(() => {
      migration = new CreateTransitNfcAndFleetMaintenanceSchema1700000000046();
    });

    it('should create smart cards, tap transactions, and maintenance orders in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "transit_smart_cards"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "nfc_tap_transactions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "fleet_maintenance_orders"');
      expect(allQueries).toContain('UQ_transit_smart_cards_uid');
    });

    it('should drop transit nfc and fleet maintenance tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "fleet_maintenance_orders"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "nfc_tap_transactions"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "transit_smart_cards"');
    });
  });

  describe('CreateInteractiveVoiceAndDrReplicationSchema1700000000047', () => {
    let migration: CreateInteractiveVoiceAndDrReplicationSchema1700000000047;

    beforeEach(() => {
      migration = new CreateInteractiveVoiceAndDrReplicationSchema1700000000047();
    });

    it('should create IVR voice sessions and DR replication health tables in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "ivr_voice_sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "dr_replication_health"');
      expect(allQueries).toContain('UQ_ivr_voice_sessions_num');
    });

    it('should drop IVR voice and DR replication tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "dr_replication_health"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "ivr_voice_sessions"');
    });
  });

  describe('CreateV2gAndSmartLockersSchema1700000000048', () => {
    let migration: CreateV2gAndSmartLockersSchema1700000000048;

    beforeEach(() => {
      migration = new CreateV2gAndSmartLockersSchema1700000000048();
    });

    it('should create V2G discharge sessions, smart lockers, and access logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "v2g_discharge_sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "smart_locker_compartments"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "locker_access_logs"');
      expect(allQueries).toContain('UQ_v2g_discharge_sessions_num');
    });

    it('should drop V2G and smart lockers tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "locker_access_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "smart_locker_compartments"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "v2g_discharge_sessions"');
    });
  });

  describe('CreateBiometricWellnessAndCleanEnergyRoutingSchema1700000000049', () => {
    let migration: CreateBiometricWellnessAndCleanEnergyRoutingSchema1700000000049;

    beforeEach(() => {
      migration = new CreateBiometricWellnessAndCleanEnergyRoutingSchema1700000000049();
    });

    it('should create captain wellness screenings and depot solar generations in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_wellness_screenings"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "depot_solar_generations"');
      expect(allQueries).toContain('UQ_captain_wellness_screenings_num');
    });

    it('should drop wellness screenings and solar generation tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "depot_solar_generations"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_wellness_screenings"');
    });
  });

  describe('CreateHighwayFastChargingAndCaptainPensionSchema1700000000050', () => {
    let migration: CreateHighwayFastChargingAndCaptainPensionSchema1700000000050;

    beforeEach(() => {
      migration = new CreateHighwayFastChargingAndCaptainPensionSchema1700000000050();
    });

    it('should create highway charging reservations, pension accounts, and deductions in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "highway_charging_reservations"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_pension_accounts"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "pension_deduction_records"');
      expect(allQueries).toContain('UQ_highway_charging_reservations_num');
      expect(allQueries).toContain('UQ_captain_pension_accounts_pran');
    });

    it('should drop pension and highway charging tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "pension_deduction_records"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_pension_accounts"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "highway_charging_reservations"');
    });
  });

  describe('CreateLostFoundCustodyAndDepotLoadBalancingSchema1700000000051', () => {
    let migration: CreateLostFoundCustodyAndDepotLoadBalancingSchema1700000000051;

    beforeEach(() => {
      migration = new CreateLostFoundCustodyAndDepotLoadBalancingSchema1700000000051();
    });

    it('should create lost item custody and depot power allocations in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "lost_item_custody"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "depot_power_allocations"');
      expect(allQueries).toContain('UQ_lost_item_custody_barcode');
    });

    it('should drop lost item custody and depot power allocation tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "depot_power_allocations"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "lost_item_custody"');
    });
  });

  describe('CreateZeroEmissionZonesAndEmergencyIslandingSchema1700000000052', () => {
    let migration: CreateZeroEmissionZonesAndEmergencyIslandingSchema1700000000052;

    beforeEach(() => {
      migration = new CreateZeroEmissionZonesAndEmergencyIslandingSchema1700000000052();
    });

    it('should create ZEZ zones, compliance records, and emergency power missions in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "zero_emission_zones"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "zez_compliance_records"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "emergency_power_missions"');
      expect(allQueries).toContain('UQ_zero_emission_zones_code');
      expect(allQueries).toContain('UQ_zez_compliance_records_num');
      expect(allQueries).toContain('UQ_emergency_power_missions_num');
    });

    it('should drop ZEZ and emergency power tables in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "emergency_power_missions"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "zez_compliance_records"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "zero_emission_zones"');
    });
  });

  describe('CreateCaptainMentorshipAndCongestionZonesSchema1700000000053', () => {
    let migration: CreateCaptainMentorshipAndCongestionZonesSchema1700000000053;

    beforeEach(() => {
      migration = new CreateCaptainMentorshipAndCongestionZonesSchema1700000000053();
    });

    it('should create captain mentorship pairings and congestion zones in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_mentorship_pairings"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "congestion_zones"');
      expect(allQueries).toContain('UQ_congestion_zones_code');
    });

    it('should drop congestion zones and mentorship pairings in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "congestion_zones"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_mentorship_pairings"');
    });
  });

  describe('CreateColdChainInsuranceAndAirportFeederSchema1700000000054', () => {
    let migration: CreateColdChainInsuranceAndAirportFeederSchema1700000000054;

    beforeEach(() => {
      migration = new CreateColdChainInsuranceAndAirportFeederSchema1700000000054();
    });

    it('should create cold chain excursion claims and airport feeder bookings in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cold_chain_excursion_claims"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "airport_feeder_bookings"');
      expect(allQueries).toContain('UQ_cold_chain_excursion_claims_ref');
    });

    it('should drop airport feeder bookings and cold chain claims in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "airport_feeder_bookings"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cold_chain_excursion_claims"');
    });
  });

  describe('CreateDriverFatigueAndDigitalPermitsSchema1700000000055', () => {
    let migration: CreateDriverFatigueAndDigitalPermitsSchema1700000000055;

    beforeEach(() => {
      migration = new CreateDriverFatigueAndDigitalPermitsSchema1700000000055();
    });

    it('should create driver fatigue events and digital permit records in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "driver_fatigue_events"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "digital_permit_records"');
      expect(allQueries).toContain('UQ_digital_permit_records_num');
    });

    it('should drop digital permit records and fatigue events in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "digital_permit_records"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "driver_fatigue_events"');
    });
  });

  describe('CreateCorporateApprovalsAndAis156SwapSchema1700000000056', () => {
    let migration: CreateCorporateApprovalsAndAis156SwapSchema1700000000056;

    beforeEach(() => {
      migration = new CreateCorporateApprovalsAndAis156SwapSchema1700000000056();
    });

    it('should create corporate requisitions and battery swap compatibility logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_requisitions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_swap_compatibility_logs"');
    });

    it('should drop swap compatibility logs and corporate requisitions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_swap_compatibility_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_requisitions"');
    });
  });

  describe('CreateV2vRescueAndCycloneRelocationSchema1700000000057', () => {
    let migration: CreateV2vRescueAndCycloneRelocationSchema1700000000057;

    beforeEach(() => {
      migration = new CreateV2vRescueAndCycloneRelocationSchema1700000000057();
    });

    it('should create V2V rescue missions and cyclone relocation plans in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "v2v_rescue_missions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cyclone_relocation_plans"');
    });

    it('should drop cyclone relocation plans and V2V rescue missions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cyclone_relocation_plans"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "v2v_rescue_missions"');
    });
  });

  describe('CreateBessAndEwayBillSchema1700000000058', () => {
    let migration: CreateBessAndEwayBillSchema1700000000058;

    beforeEach(() => {
      migration = new CreateBessAndEwayBillSchema1700000000058();
    });

    it('should create depot BESS units and e-way bill records in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "depot_bess_units"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "eway_bill_records"');
      expect(allQueries).toContain('UQ_depot_bess_units_code');
      expect(allQueries).toContain('UQ_eway_bill_records_num');
    });

    it('should drop e-way bill records and depot BESS units in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "eway_bill_records"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "depot_bess_units"');
    });
  });

  describe('CreateCaptainAcademyAndAvasTelemetrySchema1700000000059', () => {
    let migration: CreateCaptainAcademyAndAvasTelemetrySchema1700000000059;

    beforeEach(() => {
      migration = new CreateCaptainAcademyAndAvasTelemetrySchema1700000000059();
    });

    it('should create captain training certifications and AVAS telemetries in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_training_certifications"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "avas_sound_telemetries"');
    });

    it('should drop AVAS telemetries and training certifications in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "avas_sound_telemetries"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_training_certifications"');
    });
  });

  describe('CreateParcelRelayAndMicroMobilitySchema1700000000060', () => {
    let migration: CreateParcelRelayAndMicroMobilitySchema1700000000060;

    beforeEach(() => {
      migration = new CreateParcelRelayAndMicroMobilitySchema1700000000060();
    });

    it('should create inter-depot parcel relays and micro-mobility sessions in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "inter_depot_parcel_relays"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "micro_mobility_sessions"');
    });

    it('should drop micro-mobility sessions and parcel relays in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "micro_mobility_sessions"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "inter_depot_parcel_relays"');
    });
  });

  describe('CreateCarbonCreditAndPanicAudioSchema1700000000061', () => {
    let migration: CreateCarbonCreditAndPanicAudioSchema1700000000061;

    beforeEach(() => {
      migration = new CreateCarbonCreditAndPanicAudioSchema1700000000061();
    });

    it('should create carbon credit batches and panic audio incidents in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "carbon_credit_batches"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "panic_audio_incidents"');
      expect(allQueries).toContain('UQ_carbon_credit_batches_ident');
    });

    it('should drop panic audio incidents and carbon credit batches in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "panic_audio_incidents"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "carbon_credit_batches"');
    });
  });

  describe('CreateCampusLoopAndPredictiveTireSchema1700000000062', () => {
    let migration: CreateCampusLoopAndPredictiveTireSchema1700000000062;

    beforeEach(() => {
      migration = new CreateCampusLoopAndPredictiveTireSchema1700000000062();
    });

    it('should create campus shuttle schedules and predictive tire assessments in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "campus_shuttle_schedules"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "predictive_tire_assessments"');
    });

    it('should drop predictive tire assessments and campus shuttle schedules in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "predictive_tire_assessments"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "campus_shuttle_schedules"');
    });
  });

  describe('CreateBatterySecondLifeAndTransitTurnstileSchema1700000000063', () => {
    let migration: CreateBatterySecondLifeAndTransitTurnstileSchema1700000000063;

    beforeEach(() => {
      migration = new CreateBatterySecondLifeAndTransitTurnstileSchema1700000000063();
    });

    it('should create battery second life assessments and transit turnstile accesses in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_second_life_assessments"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "transit_turnstile_accesses"');
    });

    it('should drop transit turnstile accesses and battery second life assessments in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "transit_turnstile_accesses"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_second_life_assessments"');
    });
  });

  describe('CreateHighwayRestStopAndGridCurtailmentSchema1700000000064', () => {
    let migration: CreateHighwayRestStopAndGridCurtailmentSchema1700000000064;

    beforeEach(() => {
      migration = new CreateHighwayRestStopAndGridCurtailmentSchema1700000000064();
    });

    it('should create highway rest stop vouchers and grid curtailment events in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "highway_rest_stop_vouchers"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "grid_curtailment_events"');
    });

    it('should drop grid curtailment events and highway rest stop vouchers in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "grid_curtailment_events"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "highway_rest_stop_vouchers"');
    });
  });

  describe('CreateCorporateGreenAndReeferTelematicsSchema1700000000065', () => {
    let migration: CreateCorporateGreenAndReeferTelematicsSchema1700000000065;

    beforeEach(() => {
      migration = new CreateCorporateGreenAndReeferTelematicsSchema1700000000065();
    });

    it('should create corporate green profiles and reefer telematics logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_green_profiles"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "reefer_telematics_logs"');
    });

    it('should drop reefer telematics logs and corporate green profiles in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "reefer_telematics_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_green_profiles"');
    });
  });

  describe('CreateMicroMobilityBountyAndAqiMonitoringSchema1700000000066', () => {
    let migration: CreateMicroMobilityBountyAndAqiMonitoringSchema1700000000066;

    beforeEach(() => {
      migration = new CreateMicroMobilityBountyAndAqiMonitoringSchema1700000000066();
    });

    it('should create micro mobility bounties and aqi monitoring records in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "micro_mobility_bounties"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "aqi_monitoring_records"');
    });

    it('should drop aqi monitoring records and micro mobility bounties in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "aqi_monitoring_records"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "micro_mobility_bounties"');
    });
  });

  describe('CreateMonsoonTractionAndOccPostureSchema1700000000067', () => {
    let migration: CreateMonsoonTractionAndOccPostureSchema1700000000067;

    beforeEach(() => {
      migration = new CreateMonsoonTractionAndOccPostureSchema1700000000067();
    });

    it('should create monsoon traction events and occ posture audits in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "monsoon_traction_events"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "occ_posture_audits"');
    });

    it('should drop occ posture audits and monsoon traction events in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "occ_posture_audits"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "monsoon_traction_events"');
    });
  });

  describe('CreateFloodDepthAndCaptainErgonomicsSchema1700000000068', () => {
    let migration: CreateFloodDepthAndCaptainErgonomicsSchema1700000000068;

    beforeEach(() => {
      migration = new CreateFloodDepthAndCaptainErgonomicsSchema1700000000068();
    });

    it('should create flood depth assessments and captain shift ergonomics in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "flood_depth_assessments"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_shift_ergonomics"');
    });

    it('should drop captain shift ergonomics and flood depth assessments in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_shift_ergonomics"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "flood_depth_assessments"');
    });
  });

  describe('CreateSolarCanopyAndCostCenterSchema1700000000069', () => {
    let migration: CreateSolarCanopyAndCostCenterSchema1700000000069;

    beforeEach(() => {
      migration = new CreateSolarCanopyAndCostCenterSchema1700000000069();
    });

    it('should create solar canopy reservations and corporate cost centers in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "solar_canopy_reservations"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_cost_centers"');
    });

    it('should drop corporate cost centers and solar canopy reservations in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_cost_centers"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "solar_canopy_reservations"');
    });
  });

  describe('CreateLockboxAndPedestrianZoneSchema1700000000070', () => {
    let migration: CreateLockboxAndPedestrianZoneSchema1700000000070;

    beforeEach(() => {
      migration = new CreateLockboxAndPedestrianZoneSchema1700000000070();
    });

    it('should create high value lockboxes and micro mobility pedestrian zones in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "high_value_lockboxes"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "micro_mobility_pedestrian_zones"');
    });

    it('should drop micro mobility pedestrian zones and high value lockboxes in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "micro_mobility_pedestrian_zones"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "high_value_lockboxes"');
    });
  });

  describe('CreateCaptainEcoAndDisasterMobilizationSchema1700000000071', () => {
    let migration: CreateCaptainEcoAndDisasterMobilizationSchema1700000000071;

    beforeEach(() => {
      migration = new CreateCaptainEcoAndDisasterMobilizationSchema1700000000071();
    });

    it('should create captain eco driving records and disaster mobilization logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "captain_eco_driving_records"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "disaster_mobilization_logs"');
    });

    it('should drop disaster mobilization logs and captain eco driving records in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "disaster_mobilization_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "captain_eco_driving_records"');
    });
  });

  describe('CreateV2hResidentialAndExecutiveKpiSchema1700000000072', () => {
    let migration: CreateV2hResidentialAndExecutiveKpiSchema1700000000072;

    beforeEach(() => {
      migration = new CreateV2hResidentialAndExecutiveKpiSchema1700000000072();
    });

    it('should create v2h residential sessions and executive kpi snapshots in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "v2h_residential_sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "executive_kpi_snapshots"');
    });

    it('should drop executive kpi snapshots and v2h residential sessions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "executive_kpi_snapshots"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "v2h_residential_sessions"');
    });
  });

  describe('CreateSolarDepotAndFreightHashSchema1700000000073', () => {
    let migration: CreateSolarDepotAndFreightHashSchema1700000000073;

    beforeEach(() => {
      migration = new CreateSolarDepotAndFreightHashSchema1700000000073();
    });

    it('should create solar depot microgrid events and freight manifest hash records in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "solar_depot_microgrid_events"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "freight_manifest_hash_records"');
    });

    it('should drop freight manifest hash records and solar depot microgrid events in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "freight_manifest_hash_records"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "solar_depot_microgrid_events"');
    });
  });

  describe('CreateFeederDiscountAndCableThermalSchema1700000000074', () => {
    let migration: CreateFeederDiscountAndCableThermalSchema1700000000074;

    beforeEach(() => {
      migration = new CreateFeederDiscountAndCableThermalSchema1700000000074();
    });

    it('should create multimodal feeder discount claims and charging cable thermal logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "multimodal_feeder_discount_claims"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "charging_cable_thermal_logs"');
    });

    it('should drop charging cable thermal logs and multimodal feeder discount claims in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "charging_cable_thermal_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "multimodal_feeder_discount_claims"');
    });
  });

  describe('CreateCorporateOccupancyAndMultipathGpsSchema1700000000075', () => {
    let migration: CreateCorporateOccupancyAndMultipathGpsSchema1700000000075;

    beforeEach(() => {
      migration = new CreateCorporateOccupancyAndMultipathGpsSchema1700000000075();
    });

    it('should create corporate shift reconciliations and gps multipath filter logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "corporate_shift_reconciliations"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "gps_multipath_filter_logs"');
    });

    it('should drop gps multipath filter logs and corporate shift reconciliations in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "gps_multipath_filter_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "corporate_shift_reconciliations"');
    });
  });

  describe('CreateRainCoverAndSmartDepotSchema1700000000076', () => {
    let migration: CreateRainCoverAndSmartDepotSchema1700000000076;

    beforeEach(() => {
      migration = new CreateRainCoverAndSmartDepotSchema1700000000076();
    });

    it('should create rain cover escrow sessions and depot smart charging plans in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "rain_cover_escrow_sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "depot_smart_charging_plans"');
    });

    it('should drop depot smart charging plans and rain cover escrow sessions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "depot_smart_charging_plans"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "rain_cover_escrow_sessions"');
    });
  });

  describe('CreateNcmcPaymentAndFleetRebalancingSchema1700000000077', () => {
    let migration: CreateNcmcPaymentAndFleetRebalancingSchema1700000000077;

    beforeEach(() => {
      migration = new CreateNcmcPaymentAndFleetRebalancingSchema1700000000077();
    });

    it('should create ncmc transit transactions and multi district rebalancing orders in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "ncmc_transit_transactions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "multi_district_rebalancing_orders"');
    });

    it('should drop multi district rebalancing orders and ncmc transit transactions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "multi_district_rebalancing_orders"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "ncmc_transit_transactions"');
    });
  });

  describe('CreatePantographAndWeatherGovernorSchema1700000000078', () => {
    let migration: CreatePantographAndWeatherGovernorSchema1700000000078;

    beforeEach(() => {
      migration = new CreatePantographAndWeatherGovernorSchema1700000000078();
    });

    it('should create pantograph charging sessions and weather governor events in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "pantograph_charging_sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "weather_governor_events"');
    });

    it('should drop weather governor events and pantograph charging sessions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "weather_governor_events"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "pantograph_charging_sessions"');
    });
  });

  describe('CreateBmsWarrantyAndTspRoutingSchema1700000000079', () => {
    let migration: CreateBmsWarrantyAndTspRoutingSchema1700000000079;

    beforeEach(() => {
      migration = new CreateBmsWarrantyAndTspRoutingSchema1700000000079();
    });

    it('should create bms warranty telemetry logs and multi stop tsp routes in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "bms_warranty_telemetry_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "multi_stop_tsp_routes"');
    });

    it('should drop multi stop tsp routes and bms warranty telemetry logs in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "multi_stop_tsp_routes"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "bms_warranty_telemetry_logs"');
    });
  });

  describe('CreateDepotGateAndTaxCertificateSchema1700000000080', () => {
    let migration: CreateDepotGateAndTaxCertificateSchema1700000000080;

    beforeEach(() => {
      migration = new CreateDepotGateAndTaxCertificateSchema1700000000080();
    });

    it('should create depot gate access logs and tax rebate certificates in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "depot_gate_access_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "tax_rebate_certificates"');
    });

    it('should drop tax rebate certificates and depot gate access logs in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "tax_rebate_certificates"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "depot_gate_access_logs"');
    });
  });

  describe('CreateVernacularDetourAndAntiRollbackSchema1700000000081', () => {
    let migration: CreateVernacularDetourAndAntiRollbackSchema1700000000081;

    beforeEach(() => {
      migration = new CreateVernacularDetourAndAntiRollbackSchema1700000000081();
    });

    it('should create vernacular navigation prompts and anti rollback stall events in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "vernacular_navigation_prompts"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "anti_rollback_stall_events"');
    });

    it('should drop anti rollback stall events and vernacular navigation prompts in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "anti_rollback_stall_events"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "vernacular_navigation_prompts"');
    });
  });

  describe('CreateOcpiRoamingAndOccPttSchema1700000000082', () => {
    let migration: CreateOcpiRoamingAndOccPttSchema1700000000082;

    beforeEach(() => {
      migration = new CreateOcpiRoamingAndOccPttSchema1700000000082();
    });

    it('should create ocpi roaming sessions and occ push to talk channels in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "ocpi_roaming_sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "occ_push_to_talk_channels"');
    });

    it('should drop occ push to talk channels and ocpi roaming sessions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "occ_push_to_talk_channels"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "ocpi_roaming_sessions"');
    });
  });

  describe('CreateCrashImpactAndRuralAgriCargoSchema1700000000083', () => {
    let migration: CreateCrashImpactAndRuralAgriCargoSchema1700000000083;

    beforeEach(() => {
      migration = new CreateCrashImpactAndRuralAgriCargoSchema1700000000083();
    });

    it('should create crash impact events and agri produce consignments in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "crash_impact_telemetry_events"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "agri_produce_consignments"');
    });

    it('should drop agri consignments and crash impact events in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "agri_produce_consignments"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "crash_impact_telemetry_events"');
    });
  });

  describe('CreateRegenHarvestAndCellDiagnosticSchema1700000000084', () => {
    let migration: CreateRegenHarvestAndCellDiagnosticSchema1700000000084;

    beforeEach(() => {
      migration = new CreateRegenHarvestAndCellDiagnosticSchema1700000000084();
    });

    it('should create regen harvest logs and cell diagnostic gate logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "regen_harvest_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "cell_diagnostic_gate_logs"');
    });

    it('should drop cell diagnostic logs and regen harvest logs in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "cell_diagnostic_gate_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "regen_harvest_logs"');
    });
  });

  describe('CreateChargingHostRevenueAndSolarMpptSchema1700000000085', () => {
    let migration: CreateChargingHostRevenueAndSolarMpptSchema1700000000085;

    beforeEach(() => {
      migration = new CreateChargingHostRevenueAndSolarMpptSchema1700000000085();
    });

    it('should create charging host settlements and solar mppt coupling sessions in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "charging_host_settlements"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "solar_mppt_coupling_sessions"');
    });

    it('should drop solar mppt sessions and charging host settlements in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "solar_mppt_coupling_sessions"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "charging_host_settlements"');
    });
  });

  describe('CreateFloodEvacuationAndWheelAlignmentSchema1700000000086', () => {
    let migration: CreateFloodEvacuationAndWheelAlignmentSchema1700000000086;

    beforeEach(() => {
      migration = new CreateFloodEvacuationAndWheelAlignmentSchema1700000000086();
    });

    it('should create flood evacuation alerts and wheel alignment logs in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "flood_evacuation_alerts"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "wheel_alignment_logs"');
    });

    it('should drop wheel alignment logs and flood evacuation alerts in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "wheel_alignment_logs"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "flood_evacuation_alerts"');
    });
  });

  describe('CreateRoboticSwapAndGreenBondAuditSchema1700000000087', () => {
    let migration: CreateRoboticSwapAndGreenBondAuditSchema1700000000087;

    beforeEach(() => {
      migration = new CreateRoboticSwapAndGreenBondAuditSchema1700000000087();
    });

    it('should create robotic swap sessions and green bond audit reports in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "robotic_swap_sessions"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "green_bond_audit_reports"');
    });

    it('should drop green bond reports and robotic swap sessions in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "green_bond_audit_reports"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "robotic_swap_sessions"');
    });
  });

  describe('CreateGridPeakTariffAndFleetSubLeaseSchema1700000000088', () => {
    let migration: CreateGridPeakTariffAndFleetSubLeaseSchema1700000000088;

    beforeEach(() => {
      migration = new CreateGridPeakTariffAndFleetSubLeaseSchema1700000000088();
    });

    it('should create grid peak tariff logs and fleet sub lease settlements in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "grid_peak_tariff_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "fleet_sub_lease_settlements"');
    });

    it('should drop fleet sub lease settlements and grid peak tariff logs in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "fleet_sub_lease_settlements"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "grid_peak_tariff_logs"');
    });
  });

  describe('CreateSpeedGovernorGeofenceAndDepotInventorySchema1700000000089', () => {
    let migration: CreateSpeedGovernorGeofenceAndDepotInventorySchema1700000000089;

    beforeEach(() => {
      migration = new CreateSpeedGovernorGeofenceAndDepotInventorySchema1700000000089();
    });

    it('should create speed governor geofence logs and depot work orders in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "speed_governor_geofence_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "depot_work_orders"');
    });

    it('should drop depot work orders and speed governor geofence logs in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "depot_work_orders"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "speed_governor_geofence_logs"');
    });
  });

  describe('CreateInterStatePermitAndBmsArcFlashSchema1700000000090', () => {
    let migration: CreateInterStatePermitAndBmsArcFlashSchema1700000000090;

    beforeEach(() => {
      migration = new CreateInterStatePermitAndBmsArcFlashSchema1700000000090();
    });

    it('should create inter state permit passes and bms arc flash events in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "inter_state_permit_passes"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "bms_arc_flash_events"');
    });

    it('should drop bms arc flash events and inter state permit passes in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "bms_arc_flash_events"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "inter_state_permit_passes"');
    });
  });

  describe('CreateVernacularVoicePromptAndScope3CarbonSchema1700000000091', () => {
    let migration: CreateVernacularVoicePromptAndScope3CarbonSchema1700000000091;

    beforeEach(() => {
      migration = new CreateVernacularVoicePromptAndScope3CarbonSchema1700000000091();
    });

    it('should create vernacular voice prompt logs and scope3 carbon certificates in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "vernacular_voice_prompt_logs"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "scope3_carbon_certificates"');
    });

    it('should drop scope3 carbon certificates and vernacular voice prompt logs in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "scope3_carbon_certificates"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "vernacular_voice_prompt_logs"');
    });
  });

  describe('CreateBatterySecondLifeAuctionAndIntercityTransitSchema1700000000092', () => {
    let migration: CreateBatterySecondLifeAuctionAndIntercityTransitSchema1700000000092;

    beforeEach(() => {
      migration = new CreateBatterySecondLifeAuctionAndIntercityTransitSchema1700000000092();
    });

    it('should create battery second life listings and intercity seat reservations in up()', async () => {
      await migration.up(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "battery_second_life_listings"');
      expect(allQueries).toContain('CREATE TABLE IF NOT EXISTS "intercity_seat_reservations"');
    });

    it('should drop intercity seat reservations and battery second life listings in down()', async () => {
      await migration.down(mockQueryRunner as QueryRunner);

      const allQueries = executedQueries.join(' ');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "intercity_seat_reservations"');
      expect(allQueries).toContain('DROP TABLE IF EXISTS "battery_second_life_listings"');
    });
  });
});
