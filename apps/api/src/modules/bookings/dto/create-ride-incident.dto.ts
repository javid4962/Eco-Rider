import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRideIncidentDto {
  @ApiProperty({
    description:
      'Incident type category (e.g. SOS_TRIGGERED, SAFETY_STOP, ACCIDENT_REPORT, ROUTE_DEVIATION, DRIVER_BEHAVIOR, BATTERY_HAZARD)',
    example: 'SOS_TRIGGERED',
  })
  @IsString()
  @IsNotEmpty()
  incidentType!: string;

  @ApiPropertyOptional({
    description: 'Incident severity level (LOW, MEDIUM, HIGH, CRITICAL)',
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiProperty({
    description: 'Detailed description of the incident',
    example: 'Passenger triggered SOS button; safety desk initiated patrol bridge.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Optional operational telemetry or contextual metadata',
    example: { latitude: 17.723, longitude: 83.301, speedKmph: 42.5 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
