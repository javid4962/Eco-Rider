import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CargoShipment } from '../../database/entities/cargo-shipment.entity';
import { CargoStop } from '../../database/entities/cargo-stop.entity';
import { CargoCodSettlement } from '../../database/entities/cargo-cod-settlement.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { CargoService } from './cargo.service';
import { CargoController } from './cargo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CargoShipment,
      CargoStop,
      CargoCodSettlement,
      Vehicle,
      LedgerEntry,
    ]),
  ],
  controllers: [CargoController],
  providers: [CargoService],
  exports: [CargoService],
})
export class CargoModule {}

