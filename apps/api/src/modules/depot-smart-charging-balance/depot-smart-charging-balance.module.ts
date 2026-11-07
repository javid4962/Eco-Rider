import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepotSmartChargingPlanEntity } from '../../database/entities/depot-smart-charging-plan.entity';
import { DepotSmartChargingBalanceService } from './depot-smart-charging-balance.service';
import { DepotSmartChargingBalanceController } from './depot-smart-charging-balance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DepotSmartChargingPlanEntity])],
  controllers: [DepotSmartChargingBalanceController],
  providers: [DepotSmartChargingBalanceService],
  exports: [DepotSmartChargingBalanceService],
})
export class DepotSmartChargingBalanceModule {}
