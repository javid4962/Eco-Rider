import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { DisputeCategory, DisputeStatus, DisputeTicketDto, LostItemReportDto } from '@ecoride/contracts';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  fileDispute(
    @CurrentActor() actor: CurrentActorPayload,
    @Body()
    dto: {
      bookingId: string;
      category: DisputeCategory;
      description: string;
      scheduledDistanceKm?: number;
      actualDistanceKm?: number;
      chargedFarePaise?: number;
    },
  ): Promise<DisputeTicketDto> {
    return this.disputesService.fileDispute({
      ...dto,
      complainantUserId: actor.id,
      complainantRole: actor.role === 'CAPTAIN' ? 'CAPTAIN' : 'RIDER',
    });
  }

  @Post('lost-items')
  @HttpCode(HttpStatus.CREATED)
  reportLostItem(
    @CurrentActor() actor: CurrentActorPayload,
    @Body()
    dto: {
      bookingId: string;
      itemType: string;
      itemDescription: string;
    },
  ): Promise<LostItemReportDto> {
    return this.disputesService.reportLostItem({
      ...dto,
      riderId: actor.id,
    });
  }

  @Post(':ticketNumber/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(
    @Param('ticketNumber') ticketNumber: string,
    @Body() body: { status: DisputeStatus; resolutionNotes: string },
  ): Promise<DisputeTicketDto> {
    return this.disputesService.resolveDispute(ticketNumber, body);
  }
}

