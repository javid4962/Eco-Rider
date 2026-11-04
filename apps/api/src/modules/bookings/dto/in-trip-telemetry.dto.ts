import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsDateString,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InTripTelemetryDto {
  @ApiProperty({ description: 'Current captain GPS latitude', example: 16.5062 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Current captain GPS longitude', example: 80.648 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters', example: 5.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracyMeters?: number;

  @ApiPropertyOptional({ description: 'Current vehicle speed in km/h', example: 38.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(250)
  speedKmph?: number;

  @ApiPropertyOptional({ description: 'Vehicle compass heading in degrees', example: 180.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  headingDegrees?: number;

  @ApiPropertyOptional({ description: 'Current EV Battery SoC percentage', example: 76.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batterySocPercent?: number;

  @ApiPropertyOptional({ description: 'Timestamp when GPS fix was acquired', example: '2026-11-04T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}

export class MarkDropoffArrivalDto {
  @ApiProperty({ description: 'Latitude at dropoff destination', example: 16.52 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ description: 'Longitude at dropoff destination', example: 80.65 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ description: 'Optional metered odometer distance in km', example: 12.4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerKm?: number;

  @ApiPropertyOptional({ description: 'Optional operational dropoff notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
