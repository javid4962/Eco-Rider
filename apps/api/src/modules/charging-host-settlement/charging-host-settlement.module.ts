import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargingHostSettlementEntity } from '../../database/entities/charging-host-settlement.entity';
import { ChargingHostSettlementService } from './charging-host-settlement.service';
import { ChargingHostSettlementController } from './charging-host-settlement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChargingHostSettlementEntity])],
  controllers: [ChargingHostSettlementController],
  providers: [ChargingHostSettlementService],
  exports: [ChargingHostSettlementService],
})
export class ChargingHostSettlementModule {}

