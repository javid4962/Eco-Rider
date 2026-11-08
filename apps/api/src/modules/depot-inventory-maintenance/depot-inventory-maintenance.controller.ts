import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { DepotInventoryMaintenanceService } from './depot-inventory-maintenance.service';
import { CreatePreventiveWorkOrderDto } from '@ecoride/contracts';

@Controller('depot-inventory-maintenance')
export class DepotInventoryMaintenanceController {
  constructor(private readonly service: DepotInventoryMaintenanceService) {}

  @Post('work-order')
  async createWorkOrder(@Body() dto: CreatePreventiveWorkOrderDto) {
    return this.service.createWorkOrder(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getWorkOrder(id);
  }
}

