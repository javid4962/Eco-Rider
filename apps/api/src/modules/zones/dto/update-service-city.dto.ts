import { IsEnum, IsISO8601, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CityOperationalStatus, UpdateServiceCityRequest } from '@ecoride/contracts';

export class UpdateServiceCityDto implements UpdateServiceCityRequest {
  @ApiPropertyOptional({
    description: 'Human-readable city name',
    example: 'Visakhapatnam Metropolitan Region',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Operational status for the city',
    enum: CityOperationalStatus,
  })
  @IsOptional()
  @IsEnum(CityOperationalStatus)
  operationalStatus?: CityOperationalStatus;

  @ApiPropertyOptional({
    description: 'Municipal or RTO permit evidence reference',
    example: 'AP-RTO-MUNICIPAL-VZG-2025-RENEWED',
  })
  @IsOptional()
  @IsString()
  evidenceReference?: string;

  @ApiPropertyOptional({
    description: 'Permit expiration timestamp in ISO-8601 format',
    example: '2028-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  permitExpiresAt?: string;

  @ApiPropertyOptional({
    description: 'City-level category switches map',
  })
  @IsOptional()
  @IsObject()
  categorySwitches?: Record<string, boolean>;

  @ApiPropertyOptional({
    description: 'City center latitude',
    example: 17.6868,
  })
  @IsOptional()
  @IsNumber()
  centerLatitude?: number;

  @ApiPropertyOptional({
    description: 'City center longitude',
    example: 83.2185,
  })
  @IsOptional()
  @IsNumber()
  centerLongitude?: number;
}
