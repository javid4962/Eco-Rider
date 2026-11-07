import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WheelAlignmentLogEntity } from '../../database/entities/wheel-alignment-log.entity';
import { WheelAlignmentTelemetryService } from './wheel-alignment-telemetry.service';
import { WheelAlignmentTelemetryController } from './wheel-alignment-telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WheelAlignmentLogEntity])],
  controllers: [WheelAlignmentTelemetryController],
  providers: [WheelAlignmentTelemetryService],
  exports: [WheelAlignmentTelemetryService],
})
export class WheelAlignmentTelemetryModule {}
