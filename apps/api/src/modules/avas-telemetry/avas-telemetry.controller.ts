import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AvasTelemetryService } from './avas-telemetry.service';
import { AvasTelemetryDto, AvasComplianceResult } from '@ecoride/contracts';
import { AvasSoundTelemetry } from '../../database/entities/avas-sound-telemetry.entity';

@Controller('avas-telemetry')
export class AvasTelemetryController {
  constructor(private readonly avasService: AvasTelemetryService) {}

  @Post('ingest')
  async ingestTelemetry(@Body() dto: AvasTelemetryDto): Promise<AvasComplianceResult> {
    return await this.avasService.processTelemetry(dto);
  }

  @Get('vehicles/:vehicleId/logs')
  async getLogs(@Param('vehicleId') vehicleId: string): Promise<AvasSoundTelemetry[]> {
    return await this.avasService.getRecentLogs(vehicleId);
  }
}

