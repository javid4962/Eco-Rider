import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IntercityElectricTransitService } from './intercity-electric-transit.service';
import { ReserveIntercitySeatDto } from '@ecoride/contracts';

@Controller('intercity-electric-transit')
export class IntercityElectricTransitController {
  constructor(private readonly service: IntercityElectricTransitService) {}

  @Post('reserve')
  async reserve(@Body() dto: ReserveIntercitySeatDto) {
    return this.service.reserveSeat(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getReservation(id);
  }
}

