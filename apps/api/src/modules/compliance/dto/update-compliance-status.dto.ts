import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DriverComplianceStatus, UpdateComplianceStatusRequest } from '@ecoride/contracts';

export class UpdateComplianceStatusDto implements UpdateComplianceStatusRequest {
  @ApiProperty({
    enum: DriverComplianceStatus,
    example: DriverComplianceStatus.VERIFIED,
    description: 'Target compliance lifecycle status for the driver',
  })
  @IsEnum(DriverComplianceStatus, {
    message:
      'Compliance status must be PENDING, UNDER_REVIEW, VERIFIED, REJECTED, SUSPENDED, or EXPIRED',
  })
  status!: DriverComplianceStatus;

  @ApiPropertyOptional({
    example: 'Safety incident under review: passenger report #9912',
    description: 'Mandatory reason when suspending driver compliance',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  suspensionReason?: string;

  @ApiPropertyOptional({
    example: 'Andhra Pradesh Transport Department commercial badge audit complete',
    description: 'Operational review notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
