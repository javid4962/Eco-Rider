import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CorridorsService } from './corridors.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CorridorRouteDto,
  CreateCorridorRouteDto,
  CreateCorridorScheduleDto,
  CorridorScheduleDto,
  CorridorTripDto,
  BookCorridorSeatDto,
  CorridorSeatReservationDto,
  TripManifestDto,
} from '@ecoride/contracts';

@Controller('corridors')
export class CorridorsController {
  constructor(private readonly corridorsService: CorridorsService) {}

  @Get('routes')
  async getRoutes(): Promise<CorridorRouteDto[]> {
    return this.corridorsService.getRoutes();
  }

  @Post('routes')
  @HttpCode(HttpStatus.CREATED)
  async createRoute(
    @Body() dto: CreateCorridorRouteDto,
  ): Promise<CorridorRouteDto> {
    return this.corridorsService.createRoute(dto);
  }

  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  async createSchedule(
    @Body() dto: CreateCorridorScheduleDto,
  ): Promise<CorridorScheduleDto> {
    return this.corridorsService.createSchedule(dto);
  }

  @Get('routes/:routeId/trips')
  async getTripsForDate(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @Query('date') date?: string,
  ): Promise<CorridorTripDto[]> {
    const tripDate = date || new Date().toISOString().split('T')[0];
    return this.corridorsService.getTripsForDate(routeId, tripDate);
  }

  @Post('seats/book')
  @HttpCode(HttpStatus.CREATED)
  async bookSeats(
    @Body() dto: BookCorridorSeatDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<CorridorSeatReservationDto> {
    return this.corridorsService.bookSeats(actor, dto);
  }

  @Get('trips/:tripId/manifest')
  async getManifest(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<TripManifestDto> {
    return this.corridorsService.getTripManifest(tripId, actor);
  }

  @Post('trips/:tripId/check-in')
  @HttpCode(HttpStatus.OK)
  async checkInPassenger(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body('boardingPassCode') boardingPassCode: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ) {
    return this.corridorsService.checkInPassenger(tripId, boardingPassCode, actor);
  }
}

