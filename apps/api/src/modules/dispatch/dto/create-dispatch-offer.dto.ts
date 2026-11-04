import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { CreateDispatchOfferRequest, RankingStrategy } from '@ecoride/contracts';

export class CreateDispatchOfferDto implements CreateDispatchOfferRequest {
  @ApiProperty({
    description: 'Ride booking UUID to initiate or retry dispatch for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  bookingId!: string;

  @ApiPropertyOptional({
    description: 'Timeout in seconds before offer expires (default: 15s, min: 5s, max: 60s)',
    example: 15,
    default: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  offerTimeoutSeconds?: number;

  @ApiPropertyOptional({
    description: 'Preferred candidate ranking strategy (BALANCED_FAIR, FAIR_ROTATION, PROXIMITY)',
    enum: RankingStrategy,
    example: RankingStrategy.BALANCED_FAIR,
  })
  @IsOptional()
  @IsEnum(RankingStrategy)
  rankingStrategy?: RankingStrategy;
}
