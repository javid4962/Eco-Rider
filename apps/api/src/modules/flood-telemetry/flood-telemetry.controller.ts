import { Body, Controller, Post } from '@nestjs/common';
import { FloodTelemetryService } from './flood-telemetry.service';
import { IngestFloodDepthDto } from '@ecoride/contracts';

@Controller('flood-telemetry')
export class FloodTelemetryController {
  constructor(private readonly service: FloodTelemetryService) {}

  @Post('depth-reading')
  async recordDepth(@Body() dto: IngestFloodDepthDto) {
    return this.service.ingestFloodDepth(dto);
  }
}

