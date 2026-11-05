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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, AuthMiddleware).forRoutes('*');
  }
}
