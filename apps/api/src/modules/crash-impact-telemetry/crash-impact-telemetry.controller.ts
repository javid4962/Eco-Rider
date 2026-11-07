import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CrashImpactTelemetryService } from './crash-impact-telemetry.service';
import { IngestCrashImpactDto } from '@ecoride/contracts';

@Controller('crash-impact-telemetry')
export class CrashImpactTelemetryController {
  constructor(private readonly service: CrashImpactTelemetryService) {}

  @Post('ingest')
  async ingest(@Body() dto: IngestCrashImpactDto) {
    return this.service.ingestCrashImpact(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getCrashEvent(id);
  }
}
