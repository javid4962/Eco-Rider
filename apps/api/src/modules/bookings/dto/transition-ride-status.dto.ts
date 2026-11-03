import { IsEnum, IsOptional, IsUUID, IsString, IsObject, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RideStatus } from '@ecoride/contracts';

export class TransitionRideStatusDto {
  @ApiProperty({
    enum: RideStatus,
    description: 'Target lifecycle status for the ride',
    example: RideStatus.DISPATCHING,
  })
  @IsEnum(RideStatus)
  targetStatus!: RideStatus;

  @ApiPropertyOptional({
    description: 'Assigned captain UUID (required when transitioning to ASSIGNED)',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @IsOptional()
  @IsUUID()
  captainId?: string;

  @ApiPropertyOptional({
    description: 'Assigned 100% BEV vehicle UUID (required when transitioning to ASSIGNED)',
    example: '22222222-3333-4444-5555-666666666666',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({
    description: '4-digit rider start OTP (required when transitioning ARRIVED -> IN_PROGRESS)',
    example: '1234',
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  startOtp?: string;

  @ApiPropertyOptional({
    description: 'Reason for cancellation or failure',
    example: 'Rider requested cancellation prior to captain arrival',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Arbitrary operational metadata associated with this transition',
    example: { batterySocPercent: 88, gpsLatitude: 17.7231, gpsLongitude: 83.3013 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class AssignCaptainDto {
  @ApiProperty({
    description: 'Assigned captain partner UUID',
    example: '11111111-2222-3333-4444-555555555555',
  })
  @IsUUID()
  captainId!: string;

  @ApiProperty({
    description: 'Assigned 100% BEV electric vehicle UUID',
    example: '22222222-3333-4444-5555-666666666666',
  })
  @IsUUID()
  vehicleId!: string;

  @ApiPropertyOptional({ description: 'Optional operational metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class StartRideDto {
  @ApiProperty({
    description: '4-digit rider start OTP to verify passenger on board',
    example: '1234',
  })
  @IsString()
  @Length(4, 4)
  startOtp!: string;

  @ApiPropertyOptional({ description: 'Optional operational metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CancelRideDto {
  @ApiPropertyOptional({
    description: 'Mandatory or optional reason for cancelling the ride',
    example: 'Passenger changed schedule',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Optional operational metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class FailRideDto {
  @ApiProperty({
    description: 'Mandatory operational reason for marking the ride as failed',
    example: 'Dispatch window expired with zero captain acceptances',
  })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Optional operational metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
