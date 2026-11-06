import { Controller, Post, Body, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { HighwayFastChargingService } from './highway-fast-charging.service';
import {
  HighwayChargingReservationDto,
  ReserveHighwaySlotDto,
} from '@ecoride/contracts';

@Controller('highway-charging')
export class HighwayFastChargingController {
  constructor(private readonly highwayService: HighwayFastChargingService) {}

  @Post('reservations')
  @HttpCode(HttpStatus.CREATED)
  reserveSlot(@Body() dto: ReserveHighwaySlotDto): Promise<HighwayChargingReservationDto> {
    return this.highwayService.reserveSlot(dto);
  }

  @Put('reservations/:reservationId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelReservation(@Param('reservationId') reservationId: string): Promise<HighwayChargingReservationDto> {
    return this.highwayService.cancelReservation(reservationId);
  }
}

