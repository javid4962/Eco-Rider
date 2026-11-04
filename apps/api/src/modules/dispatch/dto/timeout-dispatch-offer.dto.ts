import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { TimeoutDispatchOfferRequest } from '@ecoride/contracts';

export class TimeoutDispatchOfferDto implements TimeoutDispatchOfferRequest {
  @ApiPropertyOptional({
    description: 'Triggering actor or subsystem (QUEUE_WORKER, ADMIN, SWEEPER)',
    example: 'QUEUE_WORKER',
    default: 'QUEUE_WORKER',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  triggeredBy?: string;

  @ApiPropertyOptional({
    description: 'Optional timeout reason or failure diagnostics',
    example: 'Captain no response within 15 seconds TTL window',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

