import { Body, Controller, Post } from '@nestjs/common';
import { ReeferTelematicsService } from './reefer-telematics.service';
import { ReeferTelemetryDto } from '@ecoride/contracts';

@Controller('reefer-telematics')
export class ReeferTelematicsController {
  constructor(private readonly service: ReeferTelematicsService) {}

  @Post('telemetry')
  async recordTelemetry(@Body() dto: ReeferTelemetryDto) {
    return this.service.processReeferTelemetry(dto);
  }
}
