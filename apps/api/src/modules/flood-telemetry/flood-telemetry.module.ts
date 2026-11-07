import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FloodDepthAssessment } from '../../database/entities/flood-depth-assessment.entity';
import { FloodTelemetryService } from './flood-telemetry.service';
import { FloodTelemetryController } from './flood-telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FloodDepthAssessment])],
  controllers: [FloodTelemetryController],
  providers: [FloodTelemetryService],
  exports: [FloodTelemetryService],
})
export class FloodTelemetryModule {}
