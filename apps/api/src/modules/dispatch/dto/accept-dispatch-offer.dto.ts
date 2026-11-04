import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AcceptDispatchOfferRequest } from '@ecoride/contracts';

export class AcceptDispatchOfferDto implements AcceptDispatchOfferRequest {
  @ApiPropertyOptional({
    description: 'Client idempotency key for replay prevention on mobile retries',
    example: 'idemp_offer_accept_001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Optional captain accept note or telemetry metadata',
    example: 'Accepting offer from Dwarka Nagar Stand',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
