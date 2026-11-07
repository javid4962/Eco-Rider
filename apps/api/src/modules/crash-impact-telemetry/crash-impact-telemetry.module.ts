import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrashImpactTelemetryEventEntity } from '../../database/entities/crash-impact-telemetry-event.entity';
import { CrashImpactTelemetryService } from './crash-impact-telemetry.service';
import { CrashImpactTelemetryController } from './crash-impact-telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CrashImpactTelemetryEventEntity])],
  controllers: [CrashImpactTelemetryController],
  providers: [CrashImpactTelemetryService],
  exports: [CrashImpactTelemetryService],
})
export class CrashImpactTelemetryModule {}

