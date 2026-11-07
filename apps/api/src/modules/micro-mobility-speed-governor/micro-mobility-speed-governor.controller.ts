import { Body, Controller, Post } from '@nestjs/common';
import { MicroMobilitySpeedGovernorService } from './micro-mobility-speed-governor.service';
import { IngestMicroMobilityGpsDto } from '@ecoride/contracts';

@Controller('micro-mobility-speed-governor')
export class MicroMobilitySpeedGovernorController {
  constructor(private readonly service: MicroMobilitySpeedGovernorService) {}

  @Post('telemetry')
  async recordTelemetry(@Body() dto: IngestMicroMobilityGpsDto) {
    return this.service.processGpsTelemetry(dto);
  }
}
