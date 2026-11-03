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
import { QuotesService, QuoteResult } from './quotes.service';
import { QuoteRequestDto } from '../../common/dto/quote-request.dto';
import { CORRELATION_ID_HEADER } from '../../common/middleware/correlation-id.middleware';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate electric ride quote with geofencing and EV fare estimation',
    description:
      'Computes spherical distance and integer paise fare for EV rides in Andhra Pradesh pilot cities.',
  })
  @ApiHeader({
    name: CORRELATION_ID_HEADER,
    description:
      'Optional client-supplied tracing correlation ID. Echoed back in response header and error envelopes.',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Quote calculated successfully with integer paise fare and expiration timestamp',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coordinates, missing required parameters, or restricted pilot zone',
  })
  calculateQuote(@Body() dto: QuoteRequestDto): QuoteResult {
    return this.quotesService.calculateQuote(dto);
  }

  @Post('authoritative')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Calculate electric ride quote with backend-authoritative PostGIS geofence checks, cryptographic quote tokens, and versioned fare rules',
    description:
      'Validates pickup coordinates against active polygonal service zones, resolves active approved fare rules, and persists an immutable quote with cryptographic HMAC token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote calculated successfully with versioned fare rule and quote token',
  })
  @ApiResponse({
    status: 400,
    description: 'Outside geofence, category disabled, or no active fare rule',
  })
  async calculateAuthoritativeQuote(
    @Body() dto: QuoteRequestDto & { clientForgedAvailability?: boolean },
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<QuoteResult> {
    const actorUserId =
      actor?.id && actor.id !== '00000000-0000-0000-0000-000000000000' ? actor.id : dto.riderId;
    return this.quotesService.calculateAuthoritativeQuote(dto, actorUserId);
  }

  @Post(':id/verify-eligibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify quote validity, cryptographic signature, and zone authorization',
    description:
      'Validates that the quote is active, unexpired, belongs to caller, and that service zone/category permissions remain active.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Quote UUID' })
  @ApiResponse({ status: 200, description: 'Quote is eligible for booking' })
  @ApiResponse({ status: 400, description: 'Expired, tampered, or zone-revoked quote' })
  @ApiResponse({ status: 403, description: 'Cross-account quote access attempt' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 409, description: 'Quote has already been consumed' })
  async verifyEligibility(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    body?: {
      quoteToken?: string;
      pickupLatitude?: number;
      pickupLongitude?: number;
      dropoffLatitude?: number;
      dropoffLongitude?: number;
      serviceCategory?: string;
      passengerCount?: number;
    },
    @CurrentActor() actor?: CurrentActorPayload,
  ) {
    const actorUserId =
      actor?.id && actor.id !== '00000000-0000-0000-0000-000000000000' ? actor.id : undefined;
    return this.quotesService.verifyQuoteEligibility(id, actorUserId, body);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve an existing ride quote by UUID',
    description:
      'Returns the persisted quote ensuring old ride quotes retain their original price version and breakdown snapshot.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Quote UUID' })
  @ApiResponse({ status: 200, description: 'Quote retrieved with original fare rule version' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async getQuote(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.quotesService.getQuote(id);
  }
}
