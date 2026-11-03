import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';
import { CreateFareRuleRequest, FarePromotionConfig } from '@ecoride/contracts';

export class CreateFareRuleDto implements CreateFareRuleRequest {
  @ApiProperty({
    description: 'Unique statutory or internal rule code',
    example: 'VIZAG-2W-2026-V2',
  })
  @IsString()
  @IsNotEmpty()
  ruleCode!: string;

  @ApiProperty({ description: 'Target city in Andhra Pradesh', example: 'visakhapatnam' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ description: 'Vehicle/service category', example: 'CITY_COMMUTE_2W' })
  @IsString()
  @IsNotEmpty()
  serviceCategory!: string;

  @ApiProperty({ description: 'Base flag-drop fare in integer paise', example: 2500 })
  @IsInt()
  @Min(0)
  baseFarePaise!: number;

  @ApiPropertyOptional({ description: 'Distance included in base fare in meters', example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  baseDistanceMeters?: number;

  @ApiProperty({ description: 'Per-kilometer rate in integer paise', example: 800 })
  @IsInt()
  @Min(0)
  perKmRatePaise!: number;

  @ApiPropertyOptional({
    description: 'Per-minute transit duration rate in integer paise',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  perMinuteRatePaise?: number;

  @ApiPropertyOptional({ description: 'Per-minute waiting charge in integer paise', example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  waitingChargePaisePerMinute?: number;

  @ApiPropertyOptional({ description: 'Minimum trip fare in integer paise', example: 2500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumFarePaise?: number;

  @ApiPropertyOptional({ description: 'Surge multiplier ceiling (1.00 to 2.00)', example: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(2.0)
  surgeMultiplier?: number;

  @ApiPropertyOptional({ description: 'Tax rate in basis points (500 = 5.0% GST)', example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2800)
  taxRateBps?: number;

  @ApiPropertyOptional({
    description: 'Platform commission in basis points (1500 = 15%)',
    example: 1500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  commissionRateBps?: number;

  @ApiPropertyOptional({ description: 'Optional promotions list' })
  @IsOptional()
  @IsArray()
  promotions?: FarePromotionConfig[];

  @ApiProperty({
    description: 'Effective start timestamp (ISO UTC)',
    example: '2026-01-01T00:00:00Z',
  })
  @IsDateString()
  effectiveFrom!: string;

  @ApiPropertyOptional({ description: 'Optional effective end timestamp (ISO UTC)' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({
    description: 'Flag indicating PDF illustrative sample (cannot be live default)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isIllustrative?: boolean;

  @ApiPropertyOptional({ description: 'Administrative notes or regulatory context' })
  @IsOptional()
  @IsString()
  notes?: string;
}
