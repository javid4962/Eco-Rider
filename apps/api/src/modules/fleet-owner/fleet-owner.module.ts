import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetLeaseContract } from '../../database/entities/fleet-lease-contract.entity';
import { FleetOwnerSettlement } from '../../database/entities/fleet-owner-settlement.entity';
import { FleetOwnerService } from './fleet-owner.service';
import { FleetOwnerController } from './fleet-owner.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FleetLeaseContract, FleetOwnerSettlement])],
  controllers: [FleetOwnerController],
  providers: [FleetOwnerService],
  exports: [FleetOwnerService],
})
export class FleetOwnerModule {}

