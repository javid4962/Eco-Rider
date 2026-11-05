import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatterySwapStation } from '../../database/entities/battery-swap-station.entity';
import { BatteryPack } from '../../database/entities/battery-pack.entity';
import { BatterySwapTransaction } from '../../database/entities/battery-swap-transaction.entity';
import { GridTariffWindow } from '../../database/entities/grid-tariff-window.entity';
import { BatterySwapService } from './battery-swap.service';
import { BatterySwapController } from './battery-swap.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatterySwapStation,
      BatteryPack,
      BatterySwapTransaction,
      GridTariffWindow,
    ]),
  ],
  controllers: [BatterySwapController],
  providers: [BatterySwapService],
  exports: [BatterySwapService],
})
export class BatterySwapModule {}

