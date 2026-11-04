import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargingStation } from '../../database/entities/charging-station.entity';
import { ChargingReservation } from '../../database/entities/charging-reservation.entity';
import { BatteryTelemetryLog } from '../../database/entities/battery-telemetry-log.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { ChargingService } from './charging.service';
import { ChargingController } from './charging.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChargingStation,
      ChargingReservation,
      BatteryTelemetryLog,
      Vehicle,
      LedgerEntry,
    ]),
  ],
  controllers: [ChargingController],
  providers: [ChargingService],
  exports: [ChargingService],
})
export class ChargingModule {}

