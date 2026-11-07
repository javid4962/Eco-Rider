import { Body, Controller, Post } from '@nestjs/common';
import { MonsoonTractionService } from './monsoon-traction.service';
import { RoadSurfaceTelemetryDto } from '@ecoride/contracts';

@Controller('monsoon-traction')
export class MonsoonTractionController {
  constructor(private readonly service: MonsoonTractionService) {}

  @Post('telemetry')
  async recordTelemetry(@Body() dto: RoadSurfaceTelemetryDto) {
    return this.service.evaluateRoadCondition(dto);
  }
}

