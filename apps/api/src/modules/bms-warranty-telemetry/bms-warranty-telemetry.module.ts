import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BmsWarrantyTelemetryLogEntity } from '../../database/entities/bms-warranty-telemetry-log.entity';
import { BmsWarrantyTelemetryService } from './bms-warranty-telemetry.service';
import { BmsWarrantyTelemetryController } from './bms-warranty-telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BmsWarrantyTelemetryLogEntity])],
  controllers: [BmsWarrantyTelemetryController],
  providers: [BmsWarrantyTelemetryService],
  exports: [BmsWarrantyTelemetryService],
})
export class BmsWarrantyTelemetryModule {}

