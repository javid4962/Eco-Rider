import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  Max,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RankingStrategy, SelectNearbyEligibleCaptainsRequest } from '@ecoride/contracts';

export class SelectNearbyCaptainsDto implements SelectNearbyEligibleCaptainsRequest {
  @ApiProperty({
    description: 'Pickup GPS latitude coordinate in decimal degrees',
    example: 17.7271,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  pickupLatitude!: number;

  @ApiProperty({
    description: 'Pickup GPS longitude coordinate in decimal degrees',
    example: 83.3039,
    minimum: -180,
    maximum: 180,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  pickupLongitude!: number;

  @ApiProperty({
    description: 'Operating city/municipality (e.g. visakhapatnam)',
    example: 'visakhapatnam',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({
    description:
      'Service classification or vehicle category filter (e.g. ECO_CAB, ECO_AUTO, CITY_COMMUTE_2W)',
    example: 'ECO_CAB',
  })
  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @ApiPropertyOptional({
    description: 'Number of passenger seats required for the ride',
    example: 2,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  requestedSeats?: number;

  @ApiPropertyOptional({
    description: 'Maximum radial search distance in kilometers (default: 5 km, max: 15 km)',
    example: 5.0,
    minimum: 0.5,
    maximum: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(15)
  radiusKm?: number;

  @ApiPropertyOptional({
    description:
      'Candidate dispatch ranking algorithm strategy: BALANCED_FAIR, FAIR_ROTATION, or PROXIMITY',
    enum: RankingStrategy,
    example: RankingStrategy.BALANCED_FAIR,
  })
  @IsOptional()
  @IsEnum(RankingStrategy)
  rankingStrategy?: RankingStrategy;

  @ApiPropertyOptional({
    description: 'Dropoff GPS latitude coordinate in decimal degrees (optional)',
    example: 17.7388,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLatitude?: number;

  @ApiPropertyOptional({
    description: 'Dropoff GPS longitude coordinate in decimal degrees (optional)',
    example: 83.3289,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLongitude?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of candidate captains to return (default: 10, max: 50)',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxCandidates?: number;
}
