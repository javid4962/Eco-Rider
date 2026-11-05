import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DynamicCongestionService } from './dynamic-congestion.service';
import {
  CalculateCongestionSurchargeDto,
  CongestionSurchargeResult,
} from '@ecoride/contracts';
import { CongestionZone } from '../../database/entities/congestion-zone.entity';

@Controller('dynamic-congestion')
export class DynamicCongestionController {
  constructor(private readonly congestionService: DynamicCongestionService) {}

  @Post('calculate')
  async calculateSurcharge(
    @Body() dto: CalculateCongestionSurchargeDto,
  ): Promise<CongestionSurchargeResult> {
    return await this.congestionService.calculateSurcharge(dto);
  }

  @Get('zones')
  async listActiveZones(): Promise<CongestionZone[]> {
    return await this.congestionService.listActiveZones();
  }

  @Get('zones/:code')
  async getZone(@Param('code') code: string): Promise<CongestionZone> {
    return await this.congestionService.getZoneByCode(code);
  }
}
