import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { DeclineDispatchOfferRequest, DispatchOfferDeclineReason } from '@ecoride/contracts';

export class DeclineDispatchOfferDto implements DeclineDispatchOfferRequest {
  @ApiPropertyOptional({
    description: 'Categorical reason captain declined the dispatch offer',
    enum: DispatchOfferDeclineReason,
    example: DispatchOfferDeclineReason.TOO_FAR,
    default: DispatchOfferDeclineReason.DECLINED_BY_CAPTAIN,
  })
  @IsOptional()
  @IsEnum(DispatchOfferDeclineReason)
  reason?: DispatchOfferDeclineReason | string;

  @ApiPropertyOptional({
    description: 'Optional captain note or explanation',
    example: 'Battery charging scheduled at Maddilapalem hub',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}

