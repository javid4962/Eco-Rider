import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepotLoadBalancingService } from './depot-load-balancing.service';
import { DepotLoadBalancingController } from './depot-load-balancing.controller';
import { DepotPowerAllocation } from '../../database/entities/depot-power-allocation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DepotPowerAllocation])],
  controllers: [DepotLoadBalancingController],
  providers: [DepotLoadBalancingService],
  exports: [DepotLoadBalancingService],
})
export class DepotLoadBalancingModule {}
