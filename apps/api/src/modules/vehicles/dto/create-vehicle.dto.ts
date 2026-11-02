import {
  IsEnum,
  IsInt,
  IsNotEmpty,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateVehicleRequest,
  PropulsionType,
  RangeTelemetrySource,
  VehicleCategory,
  VehicleServiceClass,
} from '@ecoride/contracts';

export class CreateVehicleDto implements CreateVehicleRequest {
  @ApiProperty({
    example: 'AP31EV0001',
    description: 'Andhra Pradesh electric commercial vehicle registration number',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  registrationNumber!: string;

  @ApiPropertyOptional({
    enum: PropulsionType,
    default: PropulsionType.BATTERY_ELECTRIC,
    description: 'Electric propulsion classification (only BATTERY_ELECTRIC is permitted)',
  })
  @IsOptional()
  @IsString()
  propulsionType?: string = PropulsionType.BATTERY_ELECTRIC;

  @ApiProperty({
    enum: VehicleCategory,
    example: VehicleCategory.CITY_COMMUTE_2W,
    description: 'Vehicle regulatory and seating category',
  })
  @IsEnum(VehicleCategory)
  @IsNotEmpty()
  vehicleCategory!: VehicleCategory;

  @ApiPropertyOptional({
    enum: VehicleServiceClass,
    example: VehicleServiceClass.ECO_BIKE,
    description: 'Commercial service classification (e.g. ECO_BIKE, ECO_AUTO, ECO_CAB, ECO_VAN)',
  })
  @IsOptional()
  @IsEnum(VehicleServiceClass)
  serviceClass?: VehicleServiceClass;

  @ApiPropertyOptional({
    example: 'D+3',
    description:
      'Standard RTO seating configuration accounting for driver separately (e.g. D+3 derives 3 customer seats + 1 driver seat)',
  })
  @IsOptional()
  @IsString()
  seatingConfiguration?: string;

  @ApiPropertyOptional({
    example: 4,
    description:
      'Total vehicle seating capacity including driver (e.g. 4 for D+3: 1 driver + 3 customer seats)',
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(11)
  @Type(() => Number)
  totalSeatingCapacity?: number;

  @ApiProperty({ example: 'Ather Energy', description: 'Electric vehicle manufacturer/make' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  make!: string;

  @ApiProperty({ example: '450X', description: 'Electric vehicle model' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model!: string;

  @ApiProperty({ example: 2024, description: 'Year of vehicle manufacture' })
  @IsInt()
  @Min(2018)
  @Max(2030)
  @Type(() => Number)
  yearOfManufacture!: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Approved passenger seating capacity (customer seats, excluding driver: 1 for 2W, 3 for 3W, 4 for 4W)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  approvedPassengerSeating?: number;

  @ApiProperty({ example: 3.7, description: 'Battery pack capacity in kilowatt-hours (kWh)' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  batteryCapacityKwh!: number;

  @ApiPropertyOptional({
    example: 100.0,
    description: 'Current State of Charge percentage (0-100%)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  currentSocPercent?: number;

  @ApiProperty({ example: 110, description: 'Certified rated range in kilometers on full charge' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  ratedRangeKm!: number;

  @ApiPropertyOptional({
    enum: RangeTelemetrySource,
    default: RangeTelemetrySource.OBD_TELEMATICS,
    description: 'Source of real-time range and battery telemetry',
  })
  @IsOptional()
  @IsEnum(RangeTelemetrySource)
  rangeTelemetrySource?: RangeTelemetrySource = RangeTelemetrySource.OBD_TELEMATICS;

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

  @ApiPropertyOptional({
    default: true,
    description: 'Whether the vehicle has verified AP RTO Green Plates',
  })
  @IsOptional()
  greenPlateVerified?: boolean;

  @ApiPropertyOptional({ default: 'visakhapatnam', description: 'Operational authorized city' })
  @IsOptional()
  @IsString()
  city?: string;
}
