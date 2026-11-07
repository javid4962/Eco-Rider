import { Body, Controller, Post } from '@nestjs/common';
import { DisasterFleetMobilizationService } from './disaster-fleet-mobilization.service';
import { MobilizationOrderDto } from '@ecoride/contracts';

@Controller('disaster-fleet-mobilization')
export class DisasterFleetMobilizationController {
  constructor(private readonly service: DisasterFleetMobilizationService) {}

  @Post('order')
  async recordOrder(@Body() dto: MobilizationOrderDto) {
    return this.service.processMobilizationOrder(dto);
  }
}
