import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PropulsionType,
  RangeTelemetrySource,
  UpdateVehicleRequest,
  VehicleCategory,
} from '@ecoride/contracts';

export class UpdateVehicleDto implements UpdateVehicleRequest {
  @ApiPropertyOptional({
    enum: VehicleCategory,
    example: VehicleCategory.CITY_COMMUTE_2W,
    description: 'Vehicle regulatory and seating category',
  })
  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  @ApiPropertyOptional({
    example: 'Ather Energy',
    description: 'Electric vehicle manufacturer/make',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  make?: string;

  @ApiPropertyOptional({ example: '450X', description: 'Electric vehicle model' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: 2024, description: 'Year of vehicle manufacture' })
  @IsOptional()
  @IsInt()
  @Min(2018)
  @Max(2030)
  @Type(() => Number)
  yearOfManufacture?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Approved passenger seating capacity (excluding driver)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  approvedPassengerSeating?: number;

  @ApiPropertyOptional({
    example: 3.7,
    description: 'Battery pack capacity in kilowatt-hours (kWh)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  batteryCapacityKwh?: number;

  @ApiPropertyOptional({
    example: 85.0,
    description: 'Current State of Charge percentage (0-100%)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  currentSocPercent?: number;

  @ApiPropertyOptional({
    example: 110,
    description: 'Certified rated range in kilometers on full charge',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  ratedRangeKm?: number;

  @ApiPropertyOptional({
    enum: RangeTelemetrySource,
    description: 'Source of real-time range and battery telemetry',
  })
  @IsOptional()
  @IsEnum(RangeTelemetrySource)
  rangeTelemetrySource?: RangeTelemetrySource;

  @ApiPropertyOptional({
    example: 'IMEI-864201048821990',
    description: 'Connected IoT telematics device ID',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  telemetryDeviceId?: string;

  @ApiPropertyOptional({ description: 'Registered vehicle owner user UUID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    example: 'POL-AP-EV-2026-9812',
    description: 'Commercial vehicle insurance policy number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({
    example: '2027-06-30T00:00:00.000Z',
    description: 'Insurance policy expiration timestamp',
  })
  @IsOptional()
  @IsString()
  insuranceExpiryDate?: string;

  @ApiPropertyOptional({
    example: 'FIT-AP31-2026-441',
    description: 'Transport fitness certificate number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fitnessCertificateNumber?: string;

  @ApiPropertyOptional({
    example: '2027-12-31T00:00:00.000Z',
    description: 'Fitness certificate expiration timestamp',
  })
  @IsOptional()
  @IsString()
  fitnessExpiryDate?: string;

  @ApiPropertyOptional({
    example: 'PERMIT-AP-EV-00129',
    description: 'AP Green-Plate Commercial Transport Permit',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  commercialPermitNumber?: string;

  @ApiPropertyOptional({
    example: '2028-12-31T00:00:00.000Z',
    description: 'Commercial permit expiration timestamp',
  })
  @IsOptional()
  @IsString()
  commercialPermitExpiry?: string;

  @ApiPropertyOptional({ description: 'Whether the vehicle has verified AP RTO Green Plates' })
  @IsOptional()
  @IsBoolean()
  greenPlateVerified?: boolean;

  @ApiPropertyOptional({ example: 'visakhapatnam', description: 'Operational authorized city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Whether the vehicle is currently active and available' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: PropulsionType,
    description:
      'Electric propulsion classification (any non-electric change is strictly rejected)',
  })
  @IsOptional()
  @IsString()
  propulsionType?: string;
}
