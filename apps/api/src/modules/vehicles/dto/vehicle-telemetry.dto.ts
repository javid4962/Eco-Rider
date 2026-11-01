import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RangeTelemetrySource, VehicleTelemetryUpdate } from '@ecoride/contracts';

export class VehicleTelemetryDto implements VehicleTelemetryUpdate {
  @ApiProperty({
    example: 72.5,
    description: 'Current real-time State of Charge (SoC) percentage (0-100%)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  currentSocPercent!: number;

  @ApiPropertyOptional({
    enum: RangeTelemetrySource,
    example: RangeTelemetrySource.BMS_IOT_GATEWAY,
    description: 'Source of the telemetry ping',
  })
  @IsOptional()
  @IsEnum(RangeTelemetrySource)
  rangeTelemetrySource?: RangeTelemetrySource;

  @ApiPropertyOptional({
    example: 80,
    description: 'Optional calculated estimated remaining range in kilometers',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  estimatedRangeKm?: number;

  @ApiPropertyOptional({
    example: 'IMEI-864201048821990',
    description: 'Unique identifier of the sending IoT device',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  telemetryDeviceId?: string;
}

