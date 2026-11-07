import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AntiRollbackStallEventEntity } from '../../database/entities/anti-rollback-stall-event.entity';
import { AntiRollbackStallTelemetryService } from './anti-rollback-stall-telemetry.service';
import { AntiRollbackStallTelemetryController } from './anti-rollback-stall-telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AntiRollbackStallEventEntity])],
  controllers: [AntiRollbackStallTelemetryController],
  providers: [AntiRollbackStallTelemetryService],
  exports: [AntiRollbackStallTelemetryService],
})
export class AntiRollbackStallTelemetryModule {}

