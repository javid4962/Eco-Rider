import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class QuoteRequestDto {
  @ApiProperty({
    description: 'Target city in Andhra Pradesh for the EV ride quote',
    example: 'visakhapatnam',
    enum: ['visakhapatnam', 'vijayawada', 'guntur', 'tirupati'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['visakhapatnam', 'vijayawada', 'guntur', 'tirupati'])
  city!: string;

  @ApiProperty({
    description: 'Service category (e.g. CITY_COMMUTE_2W, SHARED_SHUTTLE_4W)',
    example: 'CITY_COMMUTE_2W',
  })
  @IsString()
  @IsNotEmpty()
  serviceCategory!: string;

  @ApiProperty({
    description: 'Pickup latitude within Andhra Pradesh',
    example: 17.6868,
    minimum: 12.0,
    maximum: 20.0,
  })
  @IsNumber()
  @Min(12.0)
  @Max(20.0)
  pickupLatitude!: number;

  @ApiProperty({
    description: 'Pickup longitude within Andhra Pradesh',
    example: 83.2185,
    minimum: 76.0,
    maximum: 85.0,
  })
  @IsNumber()
  @Min(76.0)
  @Max(85.0)
  pickupLongitude!: number;

  @ApiProperty({
    description: 'Dropoff latitude within Andhra Pradesh',
    example: 17.7275,
    minimum: 12.0,
    maximum: 20.0,
  })
  @IsNumber()
  @Min(12.0)
  @Max(20.0)
  dropoffLatitude!: number;

  @ApiProperty({
    description: 'Dropoff longitude within Andhra Pradesh',
    example: 83.3038,
    minimum: 76.0,
    maximum: 85.0,
  })
  @IsNumber()
  @Min(76.0)
  @Max(85.0)
  dropoffLongitude!: number;

  @ApiProperty({
    description: 'Optional simulated client-forged flag to test backend enforcement rejection',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  clientForgedAvailability?: boolean;
}
