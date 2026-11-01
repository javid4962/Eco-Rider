import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleVerificationStatus, VerifyVehicleRequest } from '@ecoride/contracts';

export class VerifyVehicleDto implements VerifyVehicleRequest {
  @ApiProperty({
    enum: VehicleVerificationStatus,
    example: VehicleVerificationStatus.VERIFIED,
    description: 'Vehicle regulatory verification decision',
  })
  @IsEnum(VehicleVerificationStatus)
  @IsNotEmpty()
  status!: VehicleVerificationStatus;

  @ApiPropertyOptional({
    example: 'Valid AP commercial green plate and commercial permit confirmed',
    description: 'Reason for rejection or verification remarks',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Whether AP Green Plates have been physically / digitally verified',
  })
  @IsOptional()
  @IsBoolean()
  greenPlateVerified?: boolean;
}

