import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [HealthService, MetricsService],
  exports: [HealthService, MetricsService],
})
export class HealthModule {}
