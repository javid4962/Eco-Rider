import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MultimodalService } from './multimodal.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  TransitHubType,
  TransitHubDto,
  MultiModalTripBookingDto,
  MultiModalTicketDto,
} from '@ecoride/contracts';

@Controller('multimodal')
export class MultimodalController {
  constructor(private readonly multimodalService: MultimodalService) {}

  @Get('hubs')
  @HttpCode(HttpStatus.OK)
  listTransitHubs(
    @Query('city') city?: string,
    @Query('type') type?: TransitHubType,
  ): Promise<TransitHubDto[]> {
    return this.multimodalService.listTransitHubs(city, type);
  }

  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  bookFeederTrip(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: MultiModalTripBookingDto,
  ): Promise<MultiModalTicketDto> {
    const riderId = dto.riderId || actor.id;
    return this.multimodalService.bookMultiModalFeederTrip(riderId, dto);
  }

  @Post('tickets/:ticketNumber/board')
  @HttpCode(HttpStatus.OK)
  boardTrip(
    @Param('ticketNumber') ticketNumber: string,
  ): Promise<MultiModalTicketDto> {
    return this.multimodalService.boardMultiModalTrip(ticketNumber);
  }
}

