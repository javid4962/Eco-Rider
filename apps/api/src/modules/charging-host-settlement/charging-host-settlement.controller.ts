import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ChargingHostSettlementService } from './charging-host-settlement.service';
import { CalculateChargingHostSettlementDto } from '@ecoride/contracts';

@Controller('charging-host-settlements')
export class ChargingHostSettlementController {
  constructor(private readonly service: ChargingHostSettlementService) {}

  @Post('calculate')
  async calculate(@Body() dto: CalculateChargingHostSettlementDto) {
    return this.service.calculateAndCreateSettlement(dto);
  }

  @Patch(':id/disburse')
  async disburse(@Param('id') id: string) {
    return this.service.disburseSettlement(id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getSettlement(id);
  }
}
