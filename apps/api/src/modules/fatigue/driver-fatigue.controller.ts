import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { DriverFatigueService } from './driver-fatigue.service';
import { DriverDutyLogDto, IngestDriverFatigueTelemetryDto, FatigueLockoutStatusDto } from '@ecoride/contracts';

@Controller('driver-fatigue')
export class DriverFatigueController {
  constructor(private readonly fatigueService: DriverFatigueService) {}

  @Post('telemetry')
  @HttpCode(HttpStatus.OK)
  ingestTelemetry(@Body() dto: IngestDriverFatigueTelemetryDto): Promise<DriverDutyLogDto> {
    return this.fatigueService.ingestTelemetry(dto);
  }

  @Get('captains/:captainId/status')
  @HttpCode(HttpStatus.OK)
  checkFatigueStatus(
    @Param('captainId', ParseUUIDPipe) captainId: string,
  ): Promise<FatigueLockoutStatusDto> {
    return this.fatigueService.checkFatigueStatus(captainId);
  }
}

