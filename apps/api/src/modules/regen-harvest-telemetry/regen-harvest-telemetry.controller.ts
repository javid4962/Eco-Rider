import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { RegenHarvestTelemetryService } from './regen-harvest-telemetry.service';
import { IngestRegenTelemetryDto } from '@ecoride/contracts';

@Controller('regen-harvest-telemetry')
export class RegenHarvestTelemetryController {
  constructor(private readonly service: RegenHarvestTelemetryService) {}

  @Post('ingest')
  async ingest(@Body() dto: IngestRegenTelemetryDto) {
    return this.service.ingestRegenTelemetry(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getLog(id);
  }
}

