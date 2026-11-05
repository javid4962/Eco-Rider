import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { TelematicsBmsService } from './telematics-bms.service';
import { BmsTelemetryPingDto, BmsAnomalyAlertDto } from '@ecoride/contracts';

@Controller('telematics/bms')
export class TelematicsBmsController {
  constructor(private readonly bmsService: TelematicsBmsService) {}

  @Post('ping')
  @HttpCode(HttpStatus.OK)
  ingestPing(@Body() dto: BmsTelemetryPingDto) {
    return this.bmsService.ingestPing(dto);
  }

  @Get(':vehicleId/alerts')
  @HttpCode(HttpStatus.OK)
  getVehicleAlerts(@Param('vehicleId', ParseUUIDPipe) vehicleId: string): Promise<BmsAnomalyAlertDto[]> {
    return this.bmsService.getVehicleAlerts(vehicleId);
  }

  @Get(':vehicleId/latest')
  @HttpCode(HttpStatus.OK)
  getLatestSnapshot(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.bmsService.getLatestBmsSnapshot(vehicleId);
  }
}

