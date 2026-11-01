import {
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
  UpdateCaptainApplicationDraftRequest,
  VehicleOwnershipType,
  VehicleCategory,
  PropulsionType,
} from '@ecoride/contracts';

export class UpdateCaptainApplicationDraftDto implements UpdateCaptainApplicationDraftRequest {
  // ---------------------------------------------------------------------------
  // Driver Requirement Fields
  // ---------------------------------------------------------------------------

  @ApiPropertyOptional({
    example: 'Suresh Kumar',
    description: 'Full legal name as on driving license',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: '1992-05-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'AP31 20180004561',
    description: 'AP Commercial Driving License Number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  drivingLicenseNumber?: string;

  @ApiPropertyOptional({
    example: '2030-05-14T00:00:00.000Z',
    description: 'Driving license expiration date',
  })
  @IsOptional()
  @IsString()
  drivingLicenseExpiry?: string;

  @ApiPropertyOptional({
    example: 'BDG-AP31-2024-991',
    description: 'Transport Driver Badge number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  badgeNumber?: string;

  @ApiPropertyOptional({ example: 'Lakshmi Kumar', description: 'Emergency contact person name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Emergency contact phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Uploaded Driving License document UUID' })
  @IsOptional()
  @IsUUID()
  drivingLicenseDocId?: string;

  @ApiPropertyOptional({ description: 'Uploaded Aadhaar card document UUID' })
  @IsOptional()
  @IsUUID()
  aadhaarDocId?: string;

  @ApiPropertyOptional({ description: 'Uploaded PAN card document UUID' })
  @IsOptional()
  @IsUUID()
  panDocId?: string;

  @ApiPropertyOptional({ description: 'Uploaded Police Verification certificate document UUID' })
  @IsOptional()
  @IsUUID()
  policeVerificationDocId?: string;

  @ApiPropertyOptional({ description: 'Uploaded Captain Profile Photo document UUID' })
  @IsOptional()
  @IsUUID()
  profilePhotoDocId?: string;

  // ---------------------------------------------------------------------------
  // Vehicle Requirement Fields
  // ---------------------------------------------------------------------------

  @ApiPropertyOptional({
    enum: VehicleOwnershipType,
    example: VehicleOwnershipType.OWNED,
    description: 'Vehicle ownership mode (OWNED by captain, or FLEET_ASSIGNED by platform)',
  })
  @IsOptional()
  @IsEnum(VehicleOwnershipType)
  vehicleOwnershipType?: VehicleOwnershipType;

  @ApiPropertyOptional({
    enum: VehicleCategory,
    example: VehicleCategory.CITY_COMMUTE_2W,
    description: 'Vehicle operating category',
  })
  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  @ApiPropertyOptional({
    enum: PropulsionType,
    default: PropulsionType.BATTERY_ELECTRIC,
    description: 'Propulsion classification (strictly BATTERY_ELECTRIC; non-electric rejected)',
  })
  @IsOptional()
  @IsString()
  propulsionType?: string;

  @ApiPropertyOptional({ example: 'Ather Energy', description: 'Vehicle manufacturer/make' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vehicleMake?: string;

  @ApiPropertyOptional({ example: '450X Gen 3', description: 'Vehicle model' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vehicleModel?: string;

  @ApiPropertyOptional({ example: 2024, description: 'Vehicle year of manufacture' })
  @IsOptional()
  @IsInt()
  @Min(2018)
  @Max(2030)
  @Type(() => Number)
  vehicleYear?: number;

  @ApiPropertyOptional({
    example: 'AP31EV0001',
    description: 'AP Green-Plate Vehicle Registration Number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  vehicleRegistrationNumber?: string;

  @ApiPropertyOptional({
    example: 3.7,
    description: 'Battery pack capacity in kilowatt-hours (kWh)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  batteryCapacityKwh?: number;

  @ApiPropertyOptional({ description: 'Uploaded Vehicle RC document UUID' })
  @IsOptional()
  @IsUUID()
  vehicleRcDocId?: string;

  @ApiPropertyOptional({ description: 'Uploaded AP Green-Plate Commercial Permit document UUID' })
  @IsOptional()
  @IsUUID()
  greenPlatePermitDocId?: string;

  @ApiPropertyOptional({ description: 'Uploaded Commercial Insurance document UUID' })
  @IsOptional()
  @IsUUID()
  insuranceDocId?: string;

  @ApiPropertyOptional({ description: 'Uploaded Transport Fitness certificate document UUID' })
  @IsOptional()
  @IsUUID()
  fitnessDocId?: string;

  @ApiPropertyOptional({ example: 'visakhapatnam', description: 'Primary operating city in AP' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;
}
