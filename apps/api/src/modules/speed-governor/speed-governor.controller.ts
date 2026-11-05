import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SpeedGovernorService } from './speed-governor.service';
import {
  SpeedLimitZoneDto,
  IngestSpeedTelemetryDto,
  SpeedViolationIncidentDto,
} from '@ecoride/contracts';

@Controller('speed-governor')
export class SpeedGovernorController {
  constructor(private readonly speedService: SpeedGovernorService) {}

  @Get('zones')
  @HttpCode(HttpStatus.OK)
  getSpeedZones(): Promise<SpeedLimitZoneDto[]> {
    return this.speedService.getSpeedZones();
  }

  @Post('telemetry')
  @HttpCode(HttpStatus.OK)
  processSpeedTelemetry(@Body() dto: IngestSpeedTelemetryDto): Promise<SpeedViolationIncidentDto | null> {
    return this.speedService.processSpeedTelemetry(dto);
  }
}

