import { Body, Controller, Post } from '@nestjs/common';
import { CaptainEcoBonusService } from './captain-eco-bonus.service';
import { IngestEcoTripTelemetryDto } from '@ecoride/contracts';

@Controller('captain-eco-bonus')
export class CaptainEcoBonusController {
  constructor(private readonly service: CaptainEcoBonusService) {}

  @Post('evaluate-trip')
  async evaluateTrip(@Body() dto: IngestEcoTripTelemetryDto) {
    return this.service.evaluateTripPerformance(dto);
  }
}
