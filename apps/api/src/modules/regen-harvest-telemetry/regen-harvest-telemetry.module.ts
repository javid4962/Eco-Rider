import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegenHarvestLogEntity } from '../../database/entities/regen-harvest-log.entity';
import { RegenHarvestTelemetryService } from './regen-harvest-telemetry.service';
import { RegenHarvestTelemetryController } from './regen-harvest-telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegenHarvestLogEntity])],
  controllers: [RegenHarvestTelemetryController],
  providers: [RegenHarvestTelemetryService],
  exports: [RegenHarvestTelemetryService],
})
export class RegenHarvestTelemetryModule {}
