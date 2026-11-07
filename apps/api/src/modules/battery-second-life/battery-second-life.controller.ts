import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BatterySecondLifeService } from './battery-second-life.service';
import { EvaluateSecondLifeDto } from '@ecoride/contracts';

@Controller('battery-second-life')
export class BatterySecondLifeController {
  constructor(private readonly service: BatterySecondLifeService) {}

  @Post('evaluate')
  async evaluateSecondLife(@Body() dto: EvaluateSecondLifeDto) {
    return this.service.evaluateSecondLife(dto);
  }

  @Get(':serial')
  async getAssessment(@Param('serial') serial: string) {
    return this.service.getAssessment(serial);
  }
}

