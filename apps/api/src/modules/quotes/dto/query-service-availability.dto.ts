import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class QueryServiceAvailabilityDto {
  @ApiProperty({
    description: 'City in Andhra Pradesh for EV service availability query',
    example: 'visakhapatnam',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    description: 'Pickup latitude coordinate within Andhra Pradesh',
    example: 17.7126,
    minimum: 12.0,
    maximum: 20.0,
  })
  @IsNumber()
  @Min(12.0)
  @Max(20.0)
  pickupLatitude!: number;

  @ApiProperty({
    description: 'Pickup longitude coordinate within Andhra Pradesh',
    example: 83.3174,
    minimum: 76.0,
    maximum: 85.0,
  })
  @IsNumber()
  @Min(76.0)
  @Max(85.0)
  pickupLongitude!: number;

  @ApiProperty({
    description: 'Optional dropoff latitude to compute estimated fare & ETA for each category',
    example: 17.745,
    required: false,
    minimum: 12.0,
    maximum: 20.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(12.0)
  @Max(20.0)
  dropoffLatitude?: number;

  @ApiProperty({
    description: 'Optional dropoff longitude to compute estimated fare & ETA for each category',
    example: 83.342,
    required: false,
    minimum: 76.0,
    maximum: 85.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(76.0)
  @Max(85.0)
  dropoffLongitude?: number;

  @ApiProperty({
    description: 'Simulate zero available captains in the corridor for deterministic testing',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  simulateZeroDrivers?: boolean;
}
