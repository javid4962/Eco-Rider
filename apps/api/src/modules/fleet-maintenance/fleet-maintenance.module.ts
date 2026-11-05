import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetMaintenanceService } from './fleet-maintenance.service';
import { FleetMaintenanceController } from './fleet-maintenance.controller';
import { FleetMaintenanceOrder } from '../../database/entities/fleet-maintenance-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FleetMaintenanceOrder])],
  controllers: [FleetMaintenanceController],
  providers: [FleetMaintenanceService],
  exports: [FleetMaintenanceService],
})
export class FleetMaintenanceModule {}

