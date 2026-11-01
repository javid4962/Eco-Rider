import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { ReleaseBoundariesModule } from './modules/release-boundaries/release-boundaries.module';
import { JourneysModule } from './modules/journeys/journeys.module';
import { DesignSystemModule } from './modules/design-system/design-system.module';
import { TestMatrixModule } from './modules/test-matrix/test-matrix.module';

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
  ],
})
export class AppModule {}

