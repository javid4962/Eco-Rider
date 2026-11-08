import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { BmsArcFlashService } from './bms-arc-flash.service';
import { EvaluateArcFlashTelemetryDto } from '@ecoride/contracts';

@Controller('bms-arc-flash')
export class BmsArcFlashController {
  constructor(private readonly service: BmsArcFlashService) {}

  @Post('evaluate')
  async evaluate(@Body() dto: EvaluateArcFlashTelemetryDto) {
    return this.service.evaluateTelemetry(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getEvent(id);
  }
}
