import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FleetSubLeaseService } from './fleet-sub-lease.service';
import { ProcessSubLeaseSettlementDto } from '@ecoride/contracts';

@Controller('fleet-sub-lease')
export class FleetSubLeaseController {
  constructor(private readonly service: FleetSubLeaseService) {}

  @Post('settle')
  async settle(@Body() dto: ProcessSubLeaseSettlementDto) {
    return this.service.processSettlement(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getSettlement(id);
  }
}

