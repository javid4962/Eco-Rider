import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { FareRuleStatus } from '@ecoride/contracts';

export class QueryFareRulesDto {
  @ApiPropertyOptional({ description: 'Filter by city', example: 'visakhapatnam' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by service category', example: 'CITY_COMMUTE_2W' })
  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['DRAFT', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'REJECTED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'REJECTED', 'ARCHIVED'])
  status?: FareRuleStatus;
}
