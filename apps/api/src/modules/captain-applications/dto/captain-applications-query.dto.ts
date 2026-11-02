import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CaptainApplicationStatus, CaptainApplicationsQuery } from '@ecoride/contracts';

export class CaptainApplicationsQueryDto implements CaptainApplicationsQuery {
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
    enum: CaptainApplicationStatus,
    description: 'Filter applications by status',
  })
  @IsOptional()
  @IsEnum(CaptainApplicationStatus)
  status?: CaptainApplicationStatus;

  @ApiPropertyOptional({ example: 'visakhapatnam', description: 'Filter applications by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by applicant user UUID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Search by applicant name, phone, driving license, registration plate, or city',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
