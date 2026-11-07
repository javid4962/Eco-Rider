import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SolarMpptCouplingService } from './solar-mppt-coupling.service';
import { LogMpptCouplingTelemetryDto } from '@ecoride/contracts';

@Controller('solar-mppt-coupling')
export class SolarMpptCouplingController {
  constructor(private readonly service: SolarMpptCouplingService) {}

  @Post('telemetry')
  async logTelemetry(@Body() dto: LogMpptCouplingTelemetryDto) {
    return this.service.logMpptCouplingTelemetry(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getSession(id);
  }
}
