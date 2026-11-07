import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { DepotSmartChargingBalanceService } from './depot-smart-charging-balance.service';
import { DepotSmartChargingPlanRequest, DepotSmartChargingPlanResult } from '@ecoride/contracts';

@Controller('v1/depot-charging')
export class DepotSmartChargingBalanceController {
  constructor(private readonly chargingBalanceService: DepotSmartChargingBalanceService) {}

  @Post('balance')
  async computeChargingBalance(@Body() body: DepotSmartChargingPlanRequest): Promise<DepotSmartChargingPlanResult> {
    return this.chargingBalanceService.computeChargingBalance(body);
  }

  @Get('plans/depot/:depotId')
  async getDepotLatestPlan(@Param('depotId') depotId: string): Promise<DepotSmartChargingPlanResult> {
    return this.chargingBalanceService.getDepotLatestPlan(depotId);
  }
}

