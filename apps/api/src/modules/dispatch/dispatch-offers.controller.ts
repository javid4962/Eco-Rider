import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { DispatchOffersService } from './dispatch-offers.service';
import {
  CreateDispatchOfferDto,
  AcceptDispatchOfferDto,
  DeclineDispatchOfferDto,
  TimeoutDispatchOfferDto,
} from './dto';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  DispatchOfferDto,
  AcceptDispatchOfferResponse,
  DeclineDispatchOfferResponse,
  TimeoutDispatchOfferResponse,
  DispatchOffersSummaryResponse,
} from '@ecoride/contracts';

@ApiTags('Dispatch Offers')
@Controller('dispatch')
export class DispatchOffersController {
  constructor(private readonly dispatchOffersService: DispatchOffersService) {}

  @Post('rides/:bookingId/dispatch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initiate or retry timed dispatch matching for a ride booking (EV-043)',
    description:
      'Evaluates nearby eligible EV captains, selects the highest-scoring candidate, persists a timed offer in PostgreSQL, and enqueues a timeout job.',
  })
  @ApiParam({ name: 'bookingId', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 201, description: 'Dispatch offer created and timed successfully' })
  @ApiResponse({
    status: 400,
    description: 'No eligible EV captains nearby or max attempts reached',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 409, description: 'Booking already assigned or terminated' })
  async initiateDispatch(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @Body() dto?: CreateDispatchOfferDto,
  ): Promise<DispatchOfferDto> {
    return this.dispatchOffersService.initiateDispatch(bookingId, dto);
  }

  @Post('offers/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Captain accepts a timed dispatch offer (EV-043)',
    description:
      'Transitions offer to ACCEPTED, assigns captain/vehicle to booking, updates captain status to ON_TRIP, records immutable event, and cancels timeout. Guarantees two accept attempts on expired offers fail.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Dispatch offer UUID' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique client idempotency key for replay prevention',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Offer accepted successfully; ride assigned' })
  @ApiResponse({ status: 400, description: 'Offer expired or invalid state' })
  @ApiResponse({ status: 403, description: 'Captain not authorized to accept this offer' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  @ApiResponse({ status: 409, description: 'Ride already assigned to another captain' })
  async acceptOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AcceptDispatchOfferDto,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<AcceptDispatchOfferResponse> {
    const effectiveActor: CurrentActorPayload = actor || {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'CAPTAIN',
      scopes: [],
    };
    const effectiveKey = idempotencyKeyHeader || dto?.idempotencyKey;
    return this.dispatchOffersService.acceptOffer(id, effectiveActor, effectiveKey);
  }

  @Post('offers/:id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Captain declines a timed dispatch offer (EV-043)',
    description:
      'Records categorical decline reason, marks offer DECLINED, and automatically triggers redispatch to the next eligible candidate.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Dispatch offer UUID' })
  @ApiResponse({ status: 200, description: 'Offer declined and redispatch evaluated' })
  @ApiResponse({ status: 403, description: 'Unauthorized actor' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async declineOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DeclineDispatchOfferDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<DeclineDispatchOfferResponse> {
    const effectiveActor: CurrentActorPayload = actor || {
      id: '00000000-0000-0000-0000-000000000000',
      role: 'CAPTAIN',
      scopes: [],
    };
    return this.dispatchOffersService.declineOffer(id, effectiveActor, dto);
  }

  @Post('offers/:id/timeout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger timeout for an expired dispatch offer (EV-043)',
    description:
      'Called by queue worker or background sweeper. Marks offer as TIMED_OUT and redispatches to the next captain. Concurrency safe: does not double-assign if ride was already claimed.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Dispatch offer UUID' })
  @ApiResponse({ status: 200, description: 'Offer timed out and redispatched safely' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async timeoutOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto?: TimeoutDispatchOfferDto,
  ): Promise<TimeoutDispatchOfferResponse> {
    return this.dispatchOffersService.timeoutOffer(id, dto);
  }

  @Get('offers/:id')
  @ApiOperation({
    summary: 'Retrieve dispatch offer details by UUID',
    description: 'Returns offer state, sequence, expiry timestamp, and response details.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Dispatch offer UUID' })
  @ApiResponse({ status: 200, description: 'Offer details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async getOfferById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<DispatchOfferDto> {
    return this.dispatchOffersService.getOfferById(id, actor);
  }

  @Get('offers/captain/active')
  @ApiOperation({
    summary: 'Retrieve active pending dispatch offer for calling captain',
    description:
      'Returns the currently pending offer for the authenticated captain if not expired.',
  })
  @ApiResponse({ status: 200, description: 'Active offer or null if no pending offer' })
  async getActiveOfferForCaptain(
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<DispatchOfferDto | null> {
    const captainId = actor?.id || '00000000-0000-0000-0000-000000000000';
    return this.dispatchOffersService.getActiveOfferForCaptain(captainId, actor);
  }

  @Get('rides/:bookingId/offers')
  @ApiOperation({
    summary: 'Retrieve all dispatch offers generated for a ride booking',
    description:
      'Returns full chronological history of offers, sequences, and redispatches for a ride.',
  })
  @ApiParam({ name: 'bookingId', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Dispatch offers summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getOffersForBooking(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<DispatchOffersSummaryResponse> {
    return this.dispatchOffersService.getOffersForBooking(bookingId, actor);
  }

  @Post('sweep-expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sweep and process all overdue pending offers across PostgreSQL',
    description: 'Background maintenance endpoint for processing any orphaned expired offers.',
  })
  @ApiResponse({ status: 200, description: 'Number of expired offers processed' })
  async sweepExpired(
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<{ processedCount: number }> {
    if (
      actor &&
      actor.id !== '00000000-0000-0000-0000-000000000000' &&
      actor.role !== 'ADMIN' &&
      actor.role !== 'SYSTEM'
    ) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only admins or system workers can trigger sweepExpired.',
      });
    }
    const processedCount = await this.dispatchOffersService.processExpiredOffers();
    return { processedCount };
  }
}
