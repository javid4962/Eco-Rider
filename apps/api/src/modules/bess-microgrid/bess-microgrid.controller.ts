import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { BessMicrogridService } from './bess-microgrid.service';
import { BessTelemetryDto, BessDispatchDecisionResult } from '@ecoride/contracts';
import { DepotBessUnit } from '../../database/entities/depot-bess-unit.entity';

@Controller('bess-microgrid')
export class BessMicrogridController {
  constructor(private readonly bessService: BessMicrogridService) {}

  @Post('telemetry')
  async ingestTelemetry(@Body() dto: BessTelemetryDto): Promise<BessDispatchDecisionResult> {
    return await this.bessService.processTelemetry(dto);
  }

  @Get('units/:code')
  async getUnit(@Param('code') code: string): Promise<DepotBessUnit> {
    return await this.bessService.getBessUnit(code);
  }
}
