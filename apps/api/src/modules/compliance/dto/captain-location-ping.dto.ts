import { IsNumber, IsNotEmpty, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaptainLocationPingDto {
  @ApiProperty({
    description: 'GPS Latitude coordinate in decimal degrees',
    example: 17.7126,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'GPS Longitude coordinate in decimal degrees',
    example: 83.3174,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({
    description:
      'Horizontal location accuracy in meters (<= 50m required for dispatch eligibility)',
    example: 8.5,
    minimum: 0,
    maximum: 1000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(1000)
  accuracyMeters!: number;

  @ApiPropertyOptional({
    description: 'Compass heading/bearing in degrees (0 to 360)',
    example: 124.5,
    minimum: 0,
    maximum: 360,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  headingDegrees?: number;

  @ApiPropertyOptional({
    description: 'Current vehicle speed in kilometers per hour',
    example: 28.5,
    minimum: 0,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  speedKmph?: number;

  @ApiPropertyOptional({
    description: 'GPS Altitude in meters above sea level',
    example: 12.0,
  })
  @IsOptional()
  @IsNumber()
  altitudeMeters?: number;

  @ApiPropertyOptional({
    description: 'Current battery State of Charge percentage (0-100)',
    example: 78.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batterySocPercent?: number;

  @ApiPropertyOptional({
    description: 'Client device capture timestamp in ISO 8601 UTC format',
    example: '2026-03-11T10:15:30.000Z',
  })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
