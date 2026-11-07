import { Body, Controller, Post } from '@nestjs/common';
import { GridCurtailmentService } from './grid-curtailment.service';
import { GridFrequencyReadingDto } from '@ecoride/contracts';

@Controller('grid-curtailment')
export class GridCurtailmentController {
  constructor(private readonly service: GridCurtailmentService) {}

  @Post('frequency-reading')
  async recordReading(@Body() dto: GridFrequencyReadingDto) {
    return this.service.processGridFrequency(dto);
  }
}

