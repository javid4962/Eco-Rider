import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryAvailableCaptainsDto {
  @ApiPropertyOptional({
    description: 'City filter code (e.g. visakhapatnam)',
    example: 'visakhapatnam',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Reference pickup latitude for radial proximity search',
    example: 17.7126,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Reference pickup longitude for radial proximity search',
    example: 83.3174,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Maximum search radius in kilometers (default 5km, max 50km)',
    example: 5,
    minimum: 0.5,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(50)
  radiusKm?: number;

  @ApiPropertyOptional({
    description: 'Service category required for the ride (e.g. CITY_COMMUTE_2W, SHARED_SHUTTLE_4W)',
    example: 'CITY_COMMUTE_2W',
  })
  @IsOptional()
  @IsString()
  serviceCategory?: string;
}
