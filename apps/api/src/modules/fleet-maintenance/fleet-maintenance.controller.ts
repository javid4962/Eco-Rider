import { Controller, Post, Body, HttpCode, HttpStatus, Param, Put, Get, Query } from '@nestjs/common';
import { FleetMaintenanceService } from './fleet-maintenance.service';
import {
  MaintenanceWorkOrderDto,
  CreateMaintenanceOrderDto,
} from '@ecoride/contracts';

@Controller('fleet-maintenance')
export class FleetMaintenanceController {
  constructor(private readonly maintenanceService: FleetMaintenanceService) {}

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Body() dto: CreateMaintenanceOrderDto): Promise<MaintenanceWorkOrderDto> {
    return this.maintenanceService.createOrder(dto);
  }

  @Put('orders/:orderNumber/complete')
  @HttpCode(HttpStatus.OK)
  completeOrder(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { actualCostPaise: number },
  ): Promise<MaintenanceWorkOrderDto> {
    return this.maintenanceService.completeOrder(orderNumber, body.actualCostPaise);
  }

  @Get('vehicles/check-due')
  checkDue(
    @Query('odometerKm') odometerKm: string,
    @Query('lastServiceOdometerKm') lastServiceOdometerKm: string,
  ): { isDue: boolean; reason?: string } {
    return this.maintenanceService.checkVehicleMaintenanceDue(
      parseInt(odometerKm, 10),
      parseInt(lastServiceOdometerKm, 10),
    );
  }
}

