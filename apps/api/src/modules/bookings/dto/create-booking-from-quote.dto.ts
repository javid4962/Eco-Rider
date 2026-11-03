import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateBookingFromQuoteDto {
  @ApiProperty({
    description: 'UUID of the active authoritative quote to consume',
    example: 'a0000000-0000-4000-8000-000000000001',
  })
  @IsUUID()
  @IsNotEmpty()
  quoteId!: string;

  @ApiProperty({
    description: 'Client idempotency key for replay prevention and at-most-once execution',
    example: 'idemp-quote-booking-2026-vzg-001',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  idempotencyKey!: string;

  @ApiProperty({
    description: 'Cryptographically signed quote token issued with the quote',
    example: 'eyJhbGci...sig',
    required: false,
  })
  @IsOptional()
  @IsString()
  quoteToken?: string;

  @ApiProperty({
    description: 'Rider account UUID requesting the booking',
    example: 'b0000000-0000-4000-8000-000000000001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  riderId?: string;

  @ApiProperty({
    description: 'Pickup latitude to verify against pinned quote location',
    example: 17.7126,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  pickupLatitude?: number;

  @ApiProperty({
    description: 'Pickup longitude to verify against pinned quote location',
    example: 83.3174,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  pickupLongitude?: number;

  @ApiProperty({
    description: 'Dropoff latitude to verify against pinned quote location',
    example: 17.745,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  dropoffLatitude?: number;

  @ApiProperty({
    description: 'Dropoff longitude to verify against pinned quote location',
    example: 83.342,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  dropoffLongitude?: number;

  @ApiProperty({
    description: 'Commercial service category to verify against pinned quote',
    example: 'CITY_COMMUTE_2W',
    required: false,
  })
  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @ApiProperty({
    description: 'Passenger seats count to verify against pinned quote',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  passengerCount?: number;
}
