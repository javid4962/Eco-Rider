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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, AuthMiddleware).forRoutes('*');
  }
}
