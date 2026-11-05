import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BatteryDegradationService } from './battery-degradation.service';
import {
  BatteryDegradationDto,
  BessRepurposingOrderDto,
  EvaluateDegradationRequestDto,
} from '@ecoride/contracts';

@Controller('battery-degradation')
export class BatteryDegradationController {
  constructor(private readonly degradationService: BatteryDegradationService) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  evaluateDegradation(@Body() dto: EvaluateDegradationRequestDto): Promise<BatteryDegradationDto> {
    return this.degradationService.evaluateDegradation(dto);
  }

  @Get('repurposing-orders')
  @HttpCode(HttpStatus.OK)
  getRepurposingOrders(): Promise<BessRepurposingOrderDto[]> {
    return this.degradationService.getRepurposingOrders();
  }
}

