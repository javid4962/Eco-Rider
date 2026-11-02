import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ComplianceTargetType,
  ComplianceWarningTier,
  ComplianceWarningsQuery,
} from '@ecoride/contracts';

export class QueryComplianceWarningsDto implements ComplianceWarningsQuery {
  @ApiPropertyOptional({
    description: 'Filter warnings by user ID',
    example: 'c1000000-0000-4000-8000-000000000001',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by statutory target type',
    enum: ['DRIVER_LICENSE', 'VEHICLE_INSURANCE', 'VEHICLE_FITNESS', 'VEHICLE_PERMIT'],
  })
  @IsOptional()
  @IsEnum(['DRIVER_LICENSE', 'VEHICLE_INSURANCE', 'VEHICLE_FITNESS', 'VEHICLE_PERMIT'])
  targetType?: ComplianceTargetType;

  @ApiPropertyOptional({
    description: 'Filter by warning tier',
    enum: ComplianceWarningTier,
  })
  @IsOptional()
  @IsEnum(ComplianceWarningTier)
  warningTier?: ComplianceWarningTier;

  @ApiPropertyOptional({
    description: 'Filter by resolution state (true for resolved, false for active)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isResolved?: boolean;
}

