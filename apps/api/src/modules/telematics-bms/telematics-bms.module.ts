import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleBmsTelemetry } from '../../database/entities/vehicle-bms-telemetry.entity';
import { BmsAlertIncident } from '../../database/entities/bms-alert-incident.entity';
import { TelematicsBmsService } from './telematics-bms.service';
import { TelematicsBmsController } from './telematics-bms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleBmsTelemetry, BmsAlertIncident])],
  controllers: [TelematicsBmsController],
  providers: [TelematicsBmsService],
  exports: [TelematicsBmsService],
})
export class TelematicsBmsModule {}

