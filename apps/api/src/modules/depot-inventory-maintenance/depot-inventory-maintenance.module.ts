import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepotMaintenanceWorkOrderEntity } from '../../database/entities/depot-maintenance-work-order.entity';
import { DepotInventoryMaintenanceService } from './depot-inventory-maintenance.service';
import { DepotInventoryMaintenanceController } from './depot-inventory-maintenance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DepotMaintenanceWorkOrderEntity])],
  controllers: [DepotInventoryMaintenanceController],
  providers: [DepotInventoryMaintenanceService],
  exports: [DepotInventoryMaintenanceService],
})
export class DepotInventoryMaintenanceModule {}
