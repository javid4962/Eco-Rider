import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WheelAlignmentTelemetryService } from './wheel-alignment-telemetry.service';
import { IngestWheelAlignmentDto } from '@ecoride/contracts';

@Controller('wheel-alignment-telemetry')
export class WheelAlignmentTelemetryController {
  constructor(private readonly service: WheelAlignmentTelemetryService) {}

  @Post('telemetry')
  async ingest(@Body() dto: IngestWheelAlignmentDto) {
    return this.service.ingestWheelAlignment(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getLog(id);
  }
}

