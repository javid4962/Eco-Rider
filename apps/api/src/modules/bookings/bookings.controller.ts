import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingFromQuoteDto } from './dto/create-booking-from-quote.dto';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { CORRELATION_ID_HEADER } from '../../common/middleware/correlation-id.middleware';
import { BookingDetailsResponse } from '@ecoride/contracts';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an authoritative EV ride booking from an eligible quote',
    description:
      'Pins fare policy version, origin/destination, and passenger count. Uses ACID transactions, row locks, and idempotency safeguards.',
  })
  @ApiHeader({
    name: CORRELATION_ID_HEADER,
    description: 'Optional client tracing correlation ID',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully with pinned fare rule version and OTP',
  })
  @ApiResponse({
    status: 400,
    description: 'Quote expired, tampered token, context mismatch, or zone revoked',
  })
  @ApiResponse({
    status: 403,
    description: 'Cross-account quote access attempt',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Quote already consumed with different idempotency key',
  })
  async createBooking(
    @Body() dto: CreateBookingFromQuoteDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<BookingDetailsResponse> {
    const actorUserId =
      actor?.id && actor.id !== '00000000-0000-0000-0000-000000000000' ? actor.id : dto.riderId;
    return this.bookingsService.createBookingFromQuote(actorUserId, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve booking details by UUID',
    description: 'Returns the booking details with coordinates and fare information.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another rider booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<BookingDetailsResponse> {
    const actorUserId =
      actor?.id && actor.id !== '00000000-0000-0000-0000-000000000000' ? actor.id : undefined;
    return this.bookingsService.getBooking(id, actorUserId);
  }
}
