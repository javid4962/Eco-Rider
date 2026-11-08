import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetSubLeaseSettlementEntity } from '../../database/entities/fleet-sub-lease-settlement.entity';
import { FleetSubLeaseService } from './fleet-sub-lease.service';
import { FleetSubLeaseController } from './fleet-sub-lease.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FleetSubLeaseSettlementEntity])],
  controllers: [FleetSubLeaseController],
  providers: [FleetSubLeaseService],
  exports: [FleetSubLeaseService],
})
export class FleetSubLeaseModule {}
