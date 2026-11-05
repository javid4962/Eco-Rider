import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetDepot } from '../../database/entities/fleet-depot.entity';
import { DepotBayAllocation } from '../../database/entities/depot-bay-allocation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { DepotsService } from './depots.service';
import { DepotsController } from './depots.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FleetDepot,
      DepotBayAllocation,
      Vehicle,
    ]),
  ],
  controllers: [DepotsController],
  providers: [DepotsService],
  exports: [DepotsService],
})
export class DepotsModule {}

