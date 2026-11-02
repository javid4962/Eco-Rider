import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplianceTargetType, ReverifyComplianceRequest } from '@ecoride/contracts';

export class ReverifyComplianceDto implements ReverifyComplianceRequest {
  @ApiPropertyOptional({
    description: 'Target user ID (required for operators reverifying on behalf of captain)',
    example: 'c1000000-0000-4000-8000-000000000001',
  })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiProperty({
    description: 'Statutory document or permit category being renewed',
    enum: ['DRIVER_LICENSE', 'VEHICLE_INSURANCE', 'VEHICLE_FITNESS', 'VEHICLE_PERMIT'],
    example: 'DRIVER_LICENSE',
  })
  @IsNotEmpty()
  @IsEnum(['DRIVER_LICENSE', 'VEHICLE_INSURANCE', 'VEHICLE_FITNESS', 'VEHICLE_PERMIT'])
  targetType!: ComplianceTargetType;

  @ApiProperty({
    description: 'New statutory expiry date in ISO 8601 format (must be in the future)',
    example: '2028-11-01T23:59:59.000Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  newExpiryDate!: string;

  @ApiProperty({
    description: 'UUID of the uploaded verified document in private store',
    example: 'd1000000-0000-4000-8000-000000000001',
  })
  @IsNotEmpty()
  @IsUUID()
  documentId!: string;

  @ApiPropertyOptional({
    description: 'Updated license, policy, or commercial certificate number if reissued',
    example: 'AP31 20260009988',
  })
  @IsOptional()
  @IsString()
  newDocumentNumber?: string;

  @ApiPropertyOptional({
    description: 'Operational review notes or renewal remarks',
    example: 'Renewed Andhra Pradesh commercial transport badge submitted with RTA receipt',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
