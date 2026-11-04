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
  CancelRideDto,
  StartRideDto,
  TransitionRideStatusDto,
} from './dto/transition-ride-status.dto';
import { CreateRideIncidentDto } from './dto/create-ride-incident.dto';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { CORRELATION_ID_HEADER } from '../../common/middleware/correlation-id.middleware';
import {
  BookingDetailsResponse,
  CancelRidePolicyResponse,
  RideIncidentDto,
  RideLedgerEntryDto,
  RideTimelineResponse,
  TransitionRideStatusResponse,
  RotateStartOtpResponse,
} from '@ecoride/contracts';

@ApiTags('Rides')
@Controller('rides')
export class RidesController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Request and create an EV ride with authoritative quote and Idempotency-Key (EV-039)',
    description:
      'Creates a ride booking pinned to quote pricing, origin/destination, and passenger capacity. Deduplicates double-taps and concurrent retries safely using Idempotency-Key.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique client idempotency key for replay prevention and at-most-once creation',
    required: false,
  })
  @ApiHeader({
    name: CORRELATION_ID_HEADER,
    description: 'Optional client tracing correlation ID',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Ride created successfully or existing ride returned idempotently',
  })
  @ApiResponse({
    status: 400,
    description:
      'Missing Idempotency-Key, quote expired, tampered token, context mismatch, or zone revoked',
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
  async requestRide(
    @Body() dto: CreateBookingFromQuoteDto,
    @Headers('idempotency-key') idempotencyKeyHeader?: string,
    @Headers('x-idempotency-key') altIdempotencyKeyHeader?: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<BookingDetailsResponse> {
    const actorUserId =
      actor?.id && actor.id !== '00000000-0000-0000-0000-000000000000' ? actor.id : dto.riderId;
    const effectiveIdempotencyKey =
      idempotencyKeyHeader || altIdempotencyKeyHeader || dto.idempotencyKey;

    return this.bookingsService.createBookingFromQuote(actorUserId, dto, effectiveIdempotencyKey);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve ride details by UUID',
    description: 'Returns the ride details with pickup/dropoff coordinates, fare, and status.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Ride retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another rider booking' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  async getRide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<BookingDetailsResponse> {
    const actorUserId =
      actor?.id && actor.id !== '00000000-0000-0000-0000-000000000000' ? actor.id : undefined;
    return this.bookingsService.getBooking(id, actorUserId);
  }

  @Post(':id/arrive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark captain arrived at pickup location (EV-045)',
    description:
      'Transitions ride status from ASSIGNED to ARRIVED. Restricted to assigned captain or emergency support.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Marked arrived successfully' })
  @ApiResponse({ status: 400, description: 'Illegal status transition' })
  @ApiResponse({ status: 403, description: 'Unauthorized actor' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
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
    summary: 'Start ride trip with 4-digit passenger OTP (EV-045)',
    description:
      'Transitions ride status from ARRIVED to IN_PROGRESS. Verifies 4-digit start OTP, applies rate-limiting throttle after repeated failures, and rejects start-before-arrival.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Trip started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP, or start-before-arrival' })
  @ApiResponse({ status: 403, description: 'Unauthorized actor' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
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
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'OTP rotated successfully' })
  @ApiResponse({ status: 400, description: 'Ride already in progress' })
  @ApiResponse({ status: 403, description: 'Unauthorized actor' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
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

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transition ride status via authoritative state machine',
    description:
      'Enforces legal DAG status transitions, actor role authorization, pessimistic write lock, OTP verification, and immutable audit logging.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Status transitioned successfully' })
  @ApiResponse({ status: 400, description: 'Illegal status transition or invalid OTP' })
  @ApiResponse({ status: 403, description: 'Unauthorized actor role or cross-account access' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 409, description: 'Ride has already reached terminal status' })
  async transitionRideStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TransitionRideStatusDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<TransitionRideStatusResponse> {
    return this.bookingsService.transitionRideStatus(id, actor, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cancel ride booking with state/actor cancellation policies and fee ledger preservation (EV-039)',
    description:
      'Enforces grace periods, assesses statutory captain compensation fees when applicable, writes balanced double-entry ledger records, and strictly preserves ledger entries and active incidents.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({
    status: 200,
    description: 'Ride cancelled successfully with policy fee and preservation audit',
  })
  @ApiResponse({ status: 400, description: 'Invalid state or reason' })
  @ApiResponse({
    status: 403,
    description: 'Unauthorized actor or unilateral in-progress cancellation attempt',
  })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  @ApiResponse({ status: 409, description: 'Ride has already reached terminal status' })
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

  @Post(':id/incidents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Report a safety or operational incident on a ride (EV-039)',
    description:
      'Records an immutable incident in ride_incidents. Active incidents cannot be erased or deleted by ride cancellation.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 201, description: 'Incident logged successfully' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  async reportIncident(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateRideIncidentDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<RideIncidentDto> {
    return this.bookingsService.createRideIncident(id, actor, dto);
  }

  @Get(':id/incidents')
  @ApiOperation({
    summary: 'Retrieve all incidents recorded for a ride',
    description: 'Returns chronological list of incidents recorded in ride_incidents.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Incidents retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another user incidents' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  async getRideIncidents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<RideIncidentDto[]> {
    return this.bookingsService.getRideIncidents(id, actor);
  }

  @Get(':id/ledger')
  @ApiOperation({
    summary: 'Retrieve financial ledger entries linked to a ride (EV-039)',
    description:
      'Returns immutable double-entry ledger records (cancellation compensation, fare settlement) associated with the ride.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Ledger entries retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another user financial records' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  async getRideLedger(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<RideLedgerEntryDto[]> {
    return this.bookingsService.getRideLedgerEntries(id, actor);
  }

  @Get(':id/events')
  @ApiOperation({
    summary: 'Retrieve immutable transition event timeline for ride',
    description: 'Returns chronological list of state events recorded in ride_state_events.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Ride booking UUID' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden access to another user timeline' })
  @ApiResponse({ status: 404, description: 'Ride not found' })
  async getRideEvents(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<RideTimelineResponse> {
    return this.bookingsService.getBookingEvents(id, actor);
  }
}
