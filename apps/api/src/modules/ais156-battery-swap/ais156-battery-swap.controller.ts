import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { Ais156BatterySwapService } from './ais156-battery-swap.service';
import {
  Ais156TelemetryDto,
  Ais156ComplianceVerdictResult,
} from '@ecoride/contracts';
import { BatterySwapCompatibilityLog } from '../../database/entities/battery-swap-compatibility-log.entity';

@Controller('ais156-battery-swap')
export class Ais156BatterySwapController {
  constructor(private readonly swapService: Ais156BatterySwapService) {}

  @Post('evaluate')
  async evaluateCompatibility(
    @Body() dto: Ais156TelemetryDto,
  ): Promise<Ais156ComplianceVerdictResult> {
    return await this.swapService.evaluateCompatibility(dto);
  }

  @Get('packs/:serial/logs')
  async getRecentLogs(
    @Param('serial') serial: string,
  ): Promise<BatterySwapCompatibilityLog[]> {
    return await this.swapService.getRecentLogs(serial);
  }
}

