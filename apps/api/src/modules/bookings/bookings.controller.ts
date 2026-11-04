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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingFromQuoteDto } from './dto/create-booking-from-quote.dto';
import {
  TransitionRideStatusDto,
  AssignCaptainDto,
  StartRideDto,
  CancelRideDto,
  FailRideDto,
} from './dto/transition-ride-status.dto';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { CORRELATION_ID_HEADER } from '../../common/middleware/correlation-id.middleware';
import {
  BookingDetailsResponse,
  TransitionRideStatusResponse,
  RideTimelineResponse,
  CancelRidePolicyResponse,
  RotateStartOtpResponse,
} from '@ecoride/contracts';

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
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<BookingDetailsResponse> {
    const actorUserId =
      actor?.id && actor.id !== '00000000-0000-0000-0000-000000000000' ? actor.id : dto.riderId;
    return this.bookingsService.createBookingFromQuote(actorUserId, dto, idempotencyKeyHeader);
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

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transition ride status via the authoritative state machine (EV-038)',
    description:
      'Enforces legal DAG status transitions, actor role authorization, pessimistic write lock, OTP verification, and immutable audit logging.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Status transitioned successfully' })
  @ApiResponse({ status: 400, description: 'Illegal status transition or invalid OTP' })
  @ApiResponse({ status: 403, description: 'Unauthorized actor role or cross-account access' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 409, description: 'Ride has already reached terminal status' })
  async transitionRideStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionRideStatusDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.transitionRideStatus(id, actor, dto);
  }

  @Post(':id/dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request ride dispatch (Rider or Operator)',
    description: 'Transitions ride status from REQUESTED to DISPATCHING.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  async dispatchRide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
    @Body() body?: { metadata?: Record<string, unknown> },
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.dispatchRide(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      body?.metadata,
    );
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign captain and vehicle to ride (Captain or Dispatcher)',
    description: 'Transitions ride status from DISPATCHING to ASSIGNED.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  async assignCaptain(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignCaptainDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.assignCaptain(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      dto,
    );
  }

  @Post(':id/arrive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark captain arrived at pickup location',
    description: 'Transitions ride status from ASSIGNED to ARRIVED.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  async markCaptainArrived(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
    @Body() body?: { metadata?: Record<string, unknown> },
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.markCaptainArrived(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      body?.metadata,
    );
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start ride trip with 4-digit passenger OTP',
    description:
      'Transitions ride status from ARRIVED to IN_PROGRESS. Verifies the rider start OTP before allowing the trip to commence.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  async startRide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: StartRideDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.startRideWithOtp(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      dto,
    );
  }

  @Post(':id/rotate-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate and regenerate ride start OTP (EV-045)',
    description:
      'Generates a fresh 4-digit start OTP, clears any active verification lockout, sets a 15-minute validity window, and enforces a 30-second rate-limiting cooldown. Restricted to passenger or administrator.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'OTP rotated successfully' })
  @ApiResponse({ status: 400, description: 'Ride already in progress' })
  @ApiResponse({ status: 403, description: 'Unauthorized actor' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 409, description: 'Ride already terminated' })
  @ApiResponse({ status: 429, description: 'Rotation rate limit exceeded' })
  async rotateOtp(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
    @Body() body?: { metadata?: Record<string, unknown> },
  ): Promise<RotateStartOtpResponse> {
    return this.bookingsService.rotateStartOtp(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      body?.metadata,
    );
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete ride trip at dropoff destination',
    description: 'Transitions ride status from IN_PROGRESS to COMPLETED (terminal state).',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  async completeRide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
    @Body() body?: { metadata?: Record<string, unknown> },
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.completeRide(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      body?.metadata,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel ride booking',
    description:
      'Transitions ride status to CANCELLED (terminal state). Riders cannot cancel once trip is IN_PROGRESS.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  async cancelRide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelRideDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<CancelRidePolicyResponse> {
    return this.bookingsService.cancelRide(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      dto,
    );
  }

  @Post(':id/fail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark ride dispatch or trip as failed',
    description:
      'Transitions ride status to FAILED (terminal state). Restricted to system, operator, or safety officers.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  async failRide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: FailRideDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.failRide(
      id,
      actor || { id: '00000000-0000-0000-0000-000000000000', role: 'ANONYMOUS', scopes: [] },
      dto,
    );
  }

  @Get(':id/events')
  @ApiOperation({
    summary: 'Retrieve immutable transition event log for booking',
    description: 'Returns chronological list of state events recorded in ride_state_events.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another user timeline' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getRideEvents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<RideTimelineResponse> {
    return this.bookingsService.getBookingEvents(id, actor);
  }
}
