import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  VehicleCategory,
  VehicleVerificationStatus,
  VehiclesPaginationQuery,
} from '@ecoride/contracts';

export class VehiclesPaginationDto implements VehiclesPaginationQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: VehicleCategory,
    description: 'Filter by vehicle category',
  })
  @IsOptional()
  @IsEnum(VehicleCategory)
  category?: VehicleCategory;

  @ApiPropertyOptional({ example: 'visakhapatnam', description: 'Filter by operating city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    enum: VehicleVerificationStatus,
    description: 'Filter by verification status',
  })
  @IsOptional()
  @IsEnum(VehicleVerificationStatus)
  verificationStatus?: VehicleVerificationStatus;

  @ApiPropertyOptional({ description: 'Filter by registered owner UUID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
