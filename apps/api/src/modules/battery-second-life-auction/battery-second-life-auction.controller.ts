import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { BatterySecondLifeAuctionService } from './battery-second-life-auction.service';
import { ValueBatterySecondLifeDto } from '@ecoride/contracts';

@Controller('battery-second-life-auction')
export class BatterySecondLifeAuctionController {
  constructor(private readonly service: BatterySecondLifeAuctionService) {}

  @Post('value')
  async value(@Body() dto: ValueBatterySecondLifeDto) {
    return this.service.valueBattery(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getListing(id);
  }
}
