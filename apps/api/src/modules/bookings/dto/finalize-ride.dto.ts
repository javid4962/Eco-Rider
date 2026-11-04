import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FinalizeRideCompletionDto {
  @ApiPropertyOptional({ description: 'Actual traveled distance in meters', example: 8400 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalDistanceMeters?: number;

  @ApiPropertyOptional({ description: 'Actual ride duration in seconds', example: 1200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalDurationSeconds?: number;

  @ApiPropertyOptional({ description: 'Toll or parking surcharge in integer paise', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tollAmountPaise?: number;

  @ApiPropertyOptional({ description: 'Rider voluntary tip in integer paise', example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tipPaise?: number;

  @ApiPropertyOptional({ description: 'Unique idempotency key for safe replay protection' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
