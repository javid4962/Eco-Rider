import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvasSoundTelemetry } from '../../database/entities/avas-sound-telemetry.entity';
import { AvasTelemetryService } from './avas-telemetry.service';
import { AvasTelemetryController } from './avas-telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AvasSoundTelemetry])],
  controllers: [AvasTelemetryController],
  providers: [AvasTelemetryService],
  exports: [AvasTelemetryService],
})
export class AvasTelemetryModule {}

