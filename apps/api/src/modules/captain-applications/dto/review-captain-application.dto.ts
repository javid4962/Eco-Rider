import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CaptainApplicationStatus,
  RequirementStatus,
  ReviewCaptainApplicationRequest,
} from '@ecoride/contracts';

export class ReviewCaptainApplicationDto implements ReviewCaptainApplicationRequest {
  @ApiProperty({
    enum: [
      CaptainApplicationStatus.APPROVED,
      CaptainApplicationStatus.REJECTED,
      CaptainApplicationStatus.UNDER_REVIEW,
    ],
    example: CaptainApplicationStatus.APPROVED,
    description: 'Overall application review decision',
  })
  @IsEnum(CaptainApplicationStatus)
  @IsNotEmpty()
  overallStatus!: CaptainApplicationStatus;

  @ApiProperty({
    enum: RequirementStatus,
    example: RequirementStatus.APPROVED,
    description:
      'Independent driver requirement verification status (License, Badge, Police verification, KYC)',
  })
  @IsEnum(RequirementStatus)
  @IsNotEmpty()
  driverRequirementsStatus!: RequirementStatus;

  @ApiPropertyOptional({
    example: 'Driving license expired or unreadable photograph',
    description: 'Feedback for driver requirements if rejected or requiring changes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  driverRejectionReason?: string;

  @ApiProperty({
    enum: RequirementStatus,
    example: RequirementStatus.APPROVED,
    description:
      'Independent vehicle requirement verification status (AP Green Plate, RC, Insurance, Permit)',
  })
  @IsEnum(RequirementStatus)
  @IsNotEmpty()
  vehicleRequirementsStatus!: RequirementStatus;

  @ApiPropertyOptional({
    example: 'Commercial insurance policy expired; please upload active renewal',
    description: 'Feedback for vehicle requirements if rejected or requiring changes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  vehicleRejectionReason?: string;

  @ApiPropertyOptional({
    example: 'Driver approved for Visakhapatnam EV Auto fleet; onboarding kit dispatched',
    description: 'General review remarks and operational notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
