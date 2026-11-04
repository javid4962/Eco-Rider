import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
  IsString,
  IsUUID,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BatteryDispatchEvaluationRequest,
  BatteryDispatchPolicyConfig,
  CaptainBatterySyncRequest,
  RangeTelemetrySource,
} from '@ecoride/contracts';

export class BatteryDispatchPolicyOverridesDto implements Partial<BatteryDispatchPolicyConfig> {
  @ApiPropertyOptional({ description: 'Minimum reserve battery SoC percentage', example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  minReserveSocPercent?: number;

  @ApiPropertyOptional({ description: 'Minimum reserve range in km', example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  minReserveRangeKm?: number;

  @ApiPropertyOptional({
    description: 'Contingency charger buffer distance in km',
    example: 5.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  contingencyChargerDistanceKm?: number;

  @ApiPropertyOptional({
    description: 'Maximum telemetry age in seconds before marked stale',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(3600)
  telemetryMaxAgeSeconds?: number;

  @ApiPropertyOptional({
    description: 'Maximum distance to pickup point in km',
    example: 15.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxPickupDistanceKm?: number;
}

export class EvaluateBatteryDispatchDto implements BatteryDispatchEvaluationRequest {
  @ApiPropertyOptional({
    description: 'Driver profile ID or Captain User ID to evaluate',
    example: 'd0400000-0000-4000-8000-000000000001',
  })
  @IsOptional()
  @IsUUID()
  captainId?: string;

  @ApiPropertyOptional({
    description: 'Vehicle ID to evaluate (if not evaluating via captain)',
    example: 'v0400000-0000-4000-8000-000000000001',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({
    description: 'Pickup latitude coordinate',
    example: 17.7126,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  pickupLatitude!: number;

  @ApiProperty({
    description: 'Pickup longitude coordinate',
    example: 83.3174,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  pickupLongitude!: number;

  @ApiProperty({
    description: 'Dropoff latitude coordinate',
    example: 17.7388,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-90)
  @Max(90)
  dropoffLatitude!: number;

  @ApiProperty({
    description: 'Dropoff longitude coordinate',
    example: 83.3289,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(-180)
  @Max(180)
  dropoffLongitude!: number;

  @ApiPropertyOptional({
    description: 'Optional pre-computed trip distance in km (haversine used if omitted)',
    example: 6.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  tripDistanceKm?: number;

  @ApiPropertyOptional({
    description: 'Optional pre-computed distance from captain to pickup in km',
    example: 2.1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pickupDistanceKm?: number;

  @ApiPropertyOptional({
    description: 'Operating municipality or city',
    example: 'visakhapatnam',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Configurable policy overrides for evaluation',
    type: BatteryDispatchPolicyOverridesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BatteryDispatchPolicyOverridesDto)
  policyOverrides?: BatteryDispatchPolicyOverridesDto;
}

export class CaptainBatterySyncDto implements CaptainBatterySyncRequest {
  @ApiProperty({
    description: 'Updated battery State of Charge percentage (0.0 to 100.0)',
    example: 92.0,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  currentSocPercent!: number;

  @ApiPropertyOptional({
    description: 'Source of telemetry reading',
    enum: RangeTelemetrySource,
    example: RangeTelemetrySource.BMS_IOT_GATEWAY,
  })
  @IsOptional()
  @IsEnum(RangeTelemetrySource)
  rangeTelemetrySource?: RangeTelemetrySource;

  @ApiPropertyOptional({
    description: 'Hardware telemetry device identifier',
    example: 'BMS-ATH-98421',
  })
  @IsOptional()
  @IsString()
  telemetryDeviceId?: string;

  @ApiPropertyOptional({
    description: 'Current vehicle odometer reading in km',
    example: 14205.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  odometerKm?: number;

  @ApiPropertyOptional({
    description: 'Notes on battery sync (e.g. Swapped at Maddilapalem Depot)',
    example: 'Battery swapped with 100% pack at Maddilapalem EV Swap Depot',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
