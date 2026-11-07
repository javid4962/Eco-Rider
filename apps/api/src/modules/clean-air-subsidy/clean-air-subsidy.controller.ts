import { Body, Controller, Post } from '@nestjs/common';
import { CleanAirSubsidyService } from './clean-air-subsidy.service';
import { IngestAqiTelemetryDto, ApplyCleanAirSubsidyDto } from '@ecoride/contracts';

@Controller('clean-air-subsidy')
export class CleanAirSubsidyController {
  constructor(private readonly service: CleanAirSubsidyService) {}

  @Post('telemetry')
  async recordTelemetry(@Body() dto: IngestAqiTelemetryDto) {
    return this.service.ingestAqiTelemetry(dto);
  }

  @Post('apply-subsidy')
  async applySubsidy(@Body() dto: ApplyCleanAirSubsidyDto) {
    return this.service.applyCleanAirSubsidy(dto);
  }
}
