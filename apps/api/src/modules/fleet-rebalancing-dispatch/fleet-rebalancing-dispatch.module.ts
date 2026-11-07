import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultiDistrictRebalancingOrderEntity } from '../../database/entities/multi-district-rebalancing-order.entity';
import { FleetRebalancingDispatchService } from './fleet-rebalancing-dispatch.service';
import { FleetRebalancingDispatchController } from './fleet-rebalancing-dispatch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MultiDistrictRebalancingOrderEntity])],
  controllers: [FleetRebalancingDispatchController],
  providers: [FleetRebalancingDispatchService],
  exports: [FleetRebalancingDispatchService],
})
export class FleetRebalancingDispatchModule {}

