import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChargingCableThermalSafeguardService } from './charging-cable-thermal-safeguard.service';
import { CableThermalReading, CableThermalStatus } from '@ecoride/contracts';

@Controller('v1/charging-telematics')
export class ChargingCableThermalSafeguardController {
  constructor(private readonly thermalSafeguardService: ChargingCableThermalSafeguardService) {}

  @Post('thermal-sample')
  async evaluateThermalReading(@Body() body: CableThermalReading): Promise<CableThermalStatus> {
    return this.thermalSafeguardService.evaluateThermalReading(body);
  }

  @Get('bay/:bayId/status')
  async getBayThermalLogs(@Param('bayId') bayId: string) {
    return this.thermalSafeguardService.getBayThermalLogs(bayId);
  }
}
