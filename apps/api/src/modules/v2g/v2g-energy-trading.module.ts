import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { V2gEnergyTradingService } from './v2g-energy-trading.service';
import { V2gEnergyTradingController } from './v2g-energy-trading.controller';
import { V2gDischargeSession } from '../../database/entities/v2g-discharge-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([V2gDischargeSession])],
  controllers: [V2gEnergyTradingController],
  providers: [V2gEnergyTradingService],
  exports: [V2gEnergyTradingService],
})
export class V2gEnergyTradingModule {}

