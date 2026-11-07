import { Body, Controller, Post } from '@nestjs/common';
import { SolarCanopyReservationService } from './solar-canopy-reservation.service';
import { ReserveCanopySlotDto, CheckInCanopySessionDto } from '@ecoride/contracts';

@Controller('solar-canopy-reservation')
export class SolarCanopyReservationController {
  constructor(private readonly service: SolarCanopyReservationService) {}

  @Post('reserve')
  async reserve(@Body() dto: ReserveCanopySlotDto) {
    return this.service.reserveSlot(dto);
  }

  @Post('check-in')
  async checkIn(@Body() dto: CheckInCanopySessionDto) {
    return this.service.checkInSession(dto);
  }
}

