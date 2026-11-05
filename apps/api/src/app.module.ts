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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, AuthMiddleware).forRoutes('*');
  }
}
