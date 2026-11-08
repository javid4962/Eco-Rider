import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GridPeakTariffService } from './grid-peak-tariff.service';
import { EvaluateGridPeakTariffDto } from '@ecoride/contracts';

@Controller('grid-peak-tariff')
export class GridPeakTariffController {
  constructor(private readonly service: GridPeakTariffService) {}

  @Post('evaluate')
  async evaluate(@Body() dto: EvaluateGridPeakTariffDto) {
    return this.service.evaluateTariff(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getLog(id);
  }
}
