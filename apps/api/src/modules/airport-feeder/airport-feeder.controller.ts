import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AirportFeederService } from './airport-feeder.service';
import {
  AirportFeederBookingDto,
  FlightScheduleFeedDto,
  AirportFeederScheduleResult,
} from '@ecoride/contracts';
import { AirportFeederBooking } from '../../database/entities/airport-feeder-booking.entity';

@Controller('airport-feeder')
export class AirportFeederController {
  constructor(private readonly feederService: AirportFeederService) {}

  @Post('bookings')
  async createBooking(@Body() dto: AirportFeederBookingDto): Promise<AirportFeederBooking> {
    return await this.feederService.createBooking(dto);
  }

  @Post('flight-sync')
  async syncFlight(@Body() dto: FlightScheduleFeedDto): Promise<AirportFeederScheduleResult[]> {
    return await this.feederService.syncFlightUpdate(dto);
  }

  @Get('bookings/:id')
  async getBooking(@Param('id') id: string): Promise<AirportFeederBooking> {
    return await this.feederService.getBooking(id);
  }
}
