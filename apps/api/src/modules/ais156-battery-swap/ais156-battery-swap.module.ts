import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatterySwapCompatibilityLog } from '../../database/entities/battery-swap-compatibility-log.entity';
import { Ais156BatterySwapService } from './ais156-battery-swap.service';
import { Ais156BatterySwapController } from './ais156-battery-swap.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BatterySwapCompatibilityLog])],
  controllers: [Ais156BatterySwapController],
  providers: [Ais156BatterySwapService],
  exports: [Ais156BatterySwapService],
})
export class Ais156BatterySwapModule {}

