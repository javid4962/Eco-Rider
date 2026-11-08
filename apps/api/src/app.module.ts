import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { ReleaseBoundariesModule } from './modules/release-boundaries/release-boundaries.module';
import { JourneysModule } from './modules/journeys/journeys.module';
import { DesignSystemModule } from './modules/design-system/design-system.module';
import { TestMatrixModule } from './modules/test-matrix/test-matrix.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { SeedModule } from './modules/seed/seed.module';
import { IdentityModule } from './modules/identity/identity.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { LocalizationModule } from './common/localization/localization.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { CaptainApplicationsModule } from './modules/captain-applications/captain-applications.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { ZonesModule } from './modules/zones/zones.module';
import { MapsModule } from './modules/maps/maps.module';
import { FareRulesModule } from './modules/fare-rules/fare-rules.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { CorridorsModule } from './modules/corridors/corridors.module';
import { CommuterPassesModule } from './modules/commuter-passes/commuter-passes.module';
import { CorporateModule } from './modules/corporate/corporate.module';
import { CargoModule } from './modules/cargo/cargo.module';
import { ChargingModule } from './modules/charging/charging.module';
import { SafetyModule } from './modules/safety/safety.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SustainabilityModule } from './modules/sustainability/sustainability.module';
import { IncentivesModule } from './modules/incentives/incentives.module';
import { DepotsModule } from './modules/depots/depots.module';
import { MultimodalModule } from './modules/multimodal/multimodal.module';
import { OptimizationModule } from './modules/optimization/optimization.module';
import { BatterySwapModule } from './modules/battery-swap/battery-swap.module';
import { TelematicsBmsModule } from './modules/telematics-bms/telematics-bms.module';
import { FleetOwnerModule } from './modules/fleet-owner/fleet-owner.module';
import { OutstationModule } from './modules/outstation/outstation.module';
import { CampusModule } from './modules/campus/campus.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { ForecastingModule } from './modules/forecasting/forecasting.module';
import { RegulatoryModule } from './modules/regulatory/regulatory.module';
import { VernacularModule } from './modules/vernacular/vernacular.module';
import { EmergencyRescueModule } from './modules/rescue/emergency-rescue.module';
import { SmartChargingModule } from './modules/smart-charging/smart-charging.module';
import { DriverFatigueModule } from './modules/fatigue/driver-fatigue.module';
import { CarbonTokensModule } from './modules/carbon-tokens/carbon-tokens.module';
import { HubSpokeFreightModule } from './modules/hub-spoke/hub-spoke-freight.module';
import { HighwayTollModule } from './modules/highway-toll/highway-toll.module';
import { CorporateSubsidyModule } from './modules/corporate-subsidy/corporate-subsidy.module';
import { ColdChainModule } from './modules/cold-chain/cold-chain.module';
import { DriverMicrofinanceModule } from './modules/microfinance/driver-microfinance.module';
import { WeatherPricingModule } from './modules/weather-pricing/weather-pricing.module';
import { BatteryDegradationModule } from './modules/battery-degradation/battery-degradation.module';
import { MunicipalGeofencesModule } from './modules/municipal-geofences/municipal-geofences.module';
import { MultiPartySplitModule } from './modules/multi-party-split/multi-party-split.module';
import { SpeedGovernorModule } from './modules/speed-governor/speed-governor.module';
import { Scope3EsgModule } from './modules/scope3-esg/scope3-esg.module';
import { CaptainWelfareModule } from './modules/captain-welfare/captain-welfare.module';
import { TransitNfcModule } from './modules/transit-nfc/transit-nfc.module';
import { FleetMaintenanceModule } from './modules/fleet-maintenance/fleet-maintenance.module';
import { InteractiveVoiceModule } from './modules/interactive-voice/interactive-voice.module';
import { DisasterRecoveryModule } from './modules/disaster-recovery/disaster-recovery.module';
import { V2gEnergyTradingModule } from './modules/v2g/v2g-energy-trading.module';
import { SmartLockersModule } from './modules/smart-lockers/smart-lockers.module';
import { BiometricWellnessModule } from './modules/biometric-wellness/biometric-wellness.module';
import { CleanEnergyRoutingModule } from './modules/clean-energy/clean-energy-routing.module';
import { HighwayFastChargingModule } from './modules/highway-fast-charging/highway-fast-charging.module';
import { CaptainPensionModule } from './modules/captain-pension/captain-pension.module';
import { LostFoundCustodyModule } from './modules/lost-found-custody/lost-found-custody.module';
import { DepotLoadBalancingModule } from './modules/depot-load-balancing/depot-load-balancing.module';
import { ZeroEmissionZonesModule } from './modules/zero-emission-zones/zero-emission-zones.module';
import { EmergencyIslandingModule } from './modules/emergency-islanding/emergency-islanding.module';
import { CaptainMentorshipModule } from './modules/captain-mentorship/captain-mentorship.module';
import { DynamicCongestionModule } from './modules/dynamic-congestion/dynamic-congestion.module';
import { ColdChainInsuranceModule } from './modules/cold-chain-insurance/cold-chain-insurance.module';
import { AirportFeederModule } from './modules/airport-feeder/airport-feeder.module';
import { DmsFatigueModule } from './modules/dms-fatigue/dms-fatigue.module';
import { ApStaPermitsModule } from './modules/ap-sta-permits/ap-sta-permits.module';
import { CorporateApprovalsModule } from './modules/corporate-approvals/corporate-approvals.module';
import { Ais156BatterySwapModule } from './modules/ais156-battery-swap/ais156-battery-swap.module';
import { V2vRescueModule } from './modules/v2v-rescue/v2v-rescue.module';
import { CycloneResilienceModule } from './modules/cyclone-resilience/cyclone-resilience.module';
import { BessMicrogridModule } from './modules/bess-microgrid/bess-microgrid.module';
import { EwayBillModule } from './modules/eway-bill/eway-bill.module';
import { CaptainAcademyModule } from './modules/captain-academy/captain-academy.module';
import { AvasTelemetryModule } from './modules/avas-telemetry/avas-telemetry.module';
import { InterDepotRelayModule } from './modules/inter-depot-relay/inter-depot-relay.module';
import { MicroMobilityModule } from './modules/micro-mobility/micro-mobility.module';
import { CarbonCreditsModule } from './modules/carbon-credits/carbon-credits.module';
import { PanicAudioModule } from './modules/panic-audio/panic-audio.module';
import { CampusLoopModule } from './modules/campus-loop/campus-loop.module';
import { PredictiveTireModule } from './modules/predictive-tire/predictive-tire.module';
import { BatterySecondLifeModule } from './modules/battery-second-life/battery-second-life.module';
import { TransitTurnstileModule } from './modules/transit-turnstile/transit-turnstile.module';
import { HighwayRestStopModule } from './modules/highway-rest-stop/highway-rest-stop.module';
import { GridCurtailmentModule } from './modules/grid-curtailment/grid-curtailment.module';
import { CorporateGreenCommuteModule } from './modules/corporate-green-commute/corporate-green-commute.module';
import { ReeferTelematicsModule } from './modules/reefer-telematics/reefer-telematics.module';
import { MicroMobilityBountyModule } from './modules/micro-mobility-bounty/micro-mobility-bounty.module';
import { CleanAirSubsidyModule } from './modules/clean-air-subsidy/clean-air-subsidy.module';
import { MonsoonTractionModule } from './modules/monsoon-traction/monsoon-traction.module';
import { OccCommandWallModule } from './modules/occ-command-wall/occ-command-wall.module';
import { FloodTelemetryModule } from './modules/flood-telemetry/flood-telemetry.module';
import { CaptainShiftErgonomicsModule } from './modules/captain-shift-ergonomics/captain-shift-ergonomics.module';
import { SolarCanopyReservationModule } from './modules/solar-canopy-reservation/solar-canopy-reservation.module';
import { CorporateCostCenterModule } from './modules/corporate-cost-center/corporate-cost-center.module';
import { HighValueCargoLockboxModule } from './modules/high-value-cargo-lockbox/high-value-cargo-lockbox.module';
import { MicroMobilitySpeedGovernorModule } from './modules/micro-mobility-speed-governor/micro-mobility-speed-governor.module';
import { CaptainEcoBonusModule } from './modules/captain-eco-bonus/captain-eco-bonus.module';
import { DisasterFleetMobilizationModule } from './modules/disaster-fleet-mobilization/disaster-fleet-mobilization.module';
import { V2hResidentialBackupModule } from './modules/v2h-residential-backup/v2h-residential-backup.module';
import { ExecutiveKpiReportingModule } from './modules/executive-kpi-reporting/executive-kpi-reporting.module';
import { SolarDepotMicrogridModule } from './modules/solar-depot-microgrid/solar-depot-microgrid.module';
import { FreightManifestHashModule } from './modules/freight-manifest-hash/freight-manifest-hash.module';
import { MultimodalFeederDiscountModule } from './modules/multimodal-feeder-discount/multimodal-feeder-discount.module';
import { ChargingCableThermalSafeguardModule } from './modules/charging-cable-thermal-safeguard/charging-cable-thermal-safeguard.module';
import { CorporateShiftOccupancyModule } from './modules/corporate-shift-occupancy/corporate-shift-occupancy.module';
import { GpsMultipathRejectionModule } from './modules/gps-multipath-rejection/gps-multipath-rejection.module';
import { RainCoverEscrowModule } from './modules/rain-cover-escrow/rain-cover-escrow.module';
import { DepotSmartChargingBalanceModule } from './modules/depot-smart-charging-balance/depot-smart-charging-balance.module';
import { NcmcTransitPaymentModule } from './modules/ncmc-transit-payment/ncmc-transit-payment.module';
import { FleetRebalancingDispatchModule } from './modules/fleet-rebalancing-dispatch/fleet-rebalancing-dispatch.module';
import { PantographChargingModule } from './modules/pantograph-charging/pantograph-charging.module';
import { WeatherSpeedGovernorModule } from './modules/weather-speed-governor/weather-speed-governor.module';
import { BmsWarrantyTelemetryModule } from './modules/bms-warranty-telemetry/bms-warranty-telemetry.module';
import { MultiStopTspRoutingModule } from './modules/multi-stop-tsp-routing/multi-stop-tsp-routing.module';
import { DepotGateAnprModule } from './modules/depot-gate-anpr/depot-gate-anpr.module';
import { Section80eebTaxModule } from './modules/section-80eeb-tax/section-80eeb-tax.module';
import { VernacularVoiceDetourModule } from './modules/vernacular-voice-detour/vernacular-voice-detour.module';
import { AntiRollbackStallTelemetryModule } from './modules/anti-rollback-stall-telemetry/anti-rollback-stall-telemetry.module';
import { OcpiRoamingProtocolModule } from './modules/ocpi-roaming-protocol/ocpi-roaming-protocol.module';
import { OccPushToTalkModule } from './modules/occ-push-to-talk/occ-push-to-talk.module';
import { CrashImpactTelemetryModule } from './modules/crash-impact-telemetry/crash-impact-telemetry.module';
import { RuralAgriCargoModule } from './modules/rural-agri-cargo/rural-agri-cargo.module';
import { RegenHarvestTelemetryModule } from './modules/regen-harvest-telemetry/regen-harvest-telemetry.module';
import { CellSwellingDiagnosticModule } from './modules/cell-swelling-diagnostic/cell-swelling-diagnostic.module';
import { ChargingHostSettlementModule } from './modules/charging-host-settlement/charging-host-settlement.module';
import { SolarMpptCouplingModule } from './modules/solar-mppt-coupling/solar-mppt-coupling.module';
import { FloodEvacuationRoutingModule } from './modules/flood-evacuation-routing/flood-evacuation-routing.module';
import { WheelAlignmentTelemetryModule } from './modules/wheel-alignment-telemetry/wheel-alignment-telemetry.module';
import { RoboticSwapProtocolModule } from './modules/robotic-swap-protocol/robotic-swap-protocol.module';
import { GreenBondReportingModule } from './modules/green-bond-reporting/green-bond-reporting.module';
import { GridPeakTariffModule } from './modules/grid-peak-tariff/grid-peak-tariff.module';
import { FleetSubLeaseModule } from './modules/fleet-sub-lease/fleet-sub-lease.module';
import { SpeedGovernorGeofenceModule } from './modules/speed-governor-geofence/speed-governor-geofence.module';
import { DepotInventoryMaintenanceModule } from './modules/depot-inventory-maintenance/depot-inventory-maintenance.module';
import { InterStatePermitModule } from './modules/inter-state-permit/inter-state-permit.module';
import { BmsArcFlashModule } from './modules/bms-arc-flash/bms-arc-flash.module';
import { VernacularVoicePromptModule } from './modules/vernacular-voice-prompt/vernacular-voice-prompt.module';
import { Scope3CarbonOffsetModule } from './modules/scope3-carbon-offset/scope3-carbon-offset.module';
import { BatterySecondLifeAuctionModule } from './modules/battery-second-life-auction/battery-second-life-auction.module';
import { IntercityElectricTransitModule } from './modules/intercity-electric-transit/intercity-electric-transit.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AuthMiddleware } from './modules/auth/middleware/auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    ReleaseBoundariesModule,
    JourneysModule,
    DesignSystemModule,
    TestMatrixModule,
    QuotesModule,
    ProvidersModule,
    SeedModule,
    IdentityModule,
    AuthModule,
    PrivacyModule,
    LocalizationModule,
    DocumentsModule,
    VehiclesModule,
    CaptainApplicationsModule,
    ComplianceModule,
    FleetModule,
    ZonesModule,
    MapsModule,
    FareRulesModule,
    BookingsModule,
    DispatchModule,
    PaymentsModule,
    SettlementModule,
    CorridorsModule,
    CommuterPassesModule,
    CorporateModule,
    CargoModule,
    ChargingModule,
    SafetyModule,
    LoyaltyModule,
    AnalyticsModule,
    SustainabilityModule,
    IncentivesModule,
    DepotsModule,
    MultimodalModule,
    OptimizationModule,
    BatterySwapModule,
    TelematicsBmsModule,
    FleetOwnerModule,
    OutstationModule,
    CampusModule,
    DisputesModule,
    ForecastingModule,
    RegulatoryModule,
    VernacularModule,
    EmergencyRescueModule,
    SmartChargingModule,
    DriverFatigueModule,
    CarbonTokensModule,
    HubSpokeFreightModule,
    HighwayTollModule,
    CorporateSubsidyModule,
    ColdChainModule,
    DriverMicrofinanceModule,
    WeatherPricingModule,
    BatteryDegradationModule,
    MunicipalGeofencesModule,
    MultiPartySplitModule,
    SpeedGovernorModule,
    Scope3EsgModule,
    CaptainWelfareModule,
    TransitNfcModule,
    FleetMaintenanceModule,
    InteractiveVoiceModule,
    DisasterRecoveryModule,
    V2gEnergyTradingModule,
    SmartLockersModule,
    BiometricWellnessModule,
    CleanEnergyRoutingModule,
    HighwayFastChargingModule,
    CaptainPensionModule,
    LostFoundCustodyModule,
    DepotLoadBalancingModule,
    ZeroEmissionZonesModule,
    EmergencyIslandingModule,
    CaptainMentorshipModule,
    DynamicCongestionModule,
    ColdChainInsuranceModule,
    AirportFeederModule,
    DmsFatigueModule,
    ApStaPermitsModule,
    CorporateApprovalsModule,
    Ais156BatterySwapModule,
    V2vRescueModule,
    CycloneResilienceModule,
    BessMicrogridModule,
    EwayBillModule,
    CaptainAcademyModule,
    AvasTelemetryModule,
    InterDepotRelayModule,
    MicroMobilityModule,
    CarbonCreditsModule,
    PanicAudioModule,
    CampusLoopModule,
    PredictiveTireModule,
    BatterySecondLifeModule,
    TransitTurnstileModule,
    HighwayRestStopModule,
    GridCurtailmentModule,
    CorporateGreenCommuteModule,
    ReeferTelematicsModule,
    MicroMobilityBountyModule,
    CleanAirSubsidyModule,
    MonsoonTractionModule,
    OccCommandWallModule,
    FloodTelemetryModule,
    CaptainShiftErgonomicsModule,
    SolarCanopyReservationModule,
    CorporateCostCenterModule,
    HighValueCargoLockboxModule,
    MicroMobilitySpeedGovernorModule,
    CaptainEcoBonusModule,
    DisasterFleetMobilizationModule,
    V2hResidentialBackupModule,
    ExecutiveKpiReportingModule,
    SolarDepotMicrogridModule,
    FreightManifestHashModule,
    MultimodalFeederDiscountModule,
    ChargingCableThermalSafeguardModule,
    CorporateShiftOccupancyModule,
    GpsMultipathRejectionModule,
    RainCoverEscrowModule,
    DepotSmartChargingBalanceModule,
    NcmcTransitPaymentModule,
    FleetRebalancingDispatchModule,
    PantographChargingModule,
    WeatherSpeedGovernorModule,
    BmsWarrantyTelemetryModule,
    MultiStopTspRoutingModule,
    DepotGateAnprModule,
    Section80eebTaxModule,
    VernacularVoiceDetourModule,
    AntiRollbackStallTelemetryModule,
    OcpiRoamingProtocolModule,
    OccPushToTalkModule,
    CrashImpactTelemetryModule,
    RuralAgriCargoModule,
    RegenHarvestTelemetryModule,
    CellSwellingDiagnosticModule,
    ChargingHostSettlementModule,
    SolarMpptCouplingModule,
    FloodEvacuationRoutingModule,
    WheelAlignmentTelemetryModule,
    RoboticSwapProtocolModule,
    GreenBondReportingModule,
    GridPeakTariffModule,
    FleetSubLeaseModule,
    SpeedGovernorGeofenceModule,
    DepotInventoryMaintenanceModule,
    InterStatePermitModule,
    BmsArcFlashModule,
    VernacularVoicePromptModule,
    Scope3CarbonOffsetModule,
    BatterySecondLifeAuctionModule,
    IntercityElectricTransitModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, AuthMiddleware).forRoutes('*');
  }
}
