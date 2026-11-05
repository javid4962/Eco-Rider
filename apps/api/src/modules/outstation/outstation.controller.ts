import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OutstationService } from './outstation.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { OutstationRouteDto, OutstationBookingRequestDto, OutstationTripDto } from '@ecoride/contracts';

@Controller('outstation')
export class OutstationController {
  constructor(private readonly outstationService: OutstationService) {}

  @Get('routes')
  @HttpCode(HttpStatus.OK)
  listRoutes(): Promise<OutstationRouteDto[]> {
    return this.outstationService.listRoutes();
  }

  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  bookTrip(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: OutstationBookingRequestDto,
  ): Promise<OutstationTripDto> {
    const riderId = dto.riderId || actor.id;
    return this.outstationService.bookTrip(riderId, dto);
  }
}

