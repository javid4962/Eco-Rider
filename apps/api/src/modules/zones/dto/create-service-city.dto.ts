import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CityOperationalStatus, CreateServiceCityRequest } from '@ecoride/contracts';

export class CreateServiceCityDto implements CreateServiceCityRequest {
  @ApiProperty({
    description: 'Unique lower-case city code in Andhra Pradesh (e.g. visakhapatnam, vijayawada)',
    example: 'visakhapatnam',
  })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({
    description: 'Human-readable city name',
    example: 'Visakhapatnam',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'State name (default: Andhra Pradesh)',
    example: 'Andhra Pradesh',
    default: 'Andhra Pradesh',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Operational status for the city',
    enum: CityOperationalStatus,
    default: CityOperationalStatus.DISABLED,
  })
  @IsOptional()
  @IsEnum(CityOperationalStatus)
  operationalStatus?: CityOperationalStatus;

  @ApiPropertyOptional({
    description: 'Municipal or RTO permit evidence reference',
    example: 'AP-RTO-MUNICIPAL-VZG-2025',
  })
  @IsOptional()
  @IsString()
  evidenceReference?: string;

  @ApiPropertyOptional({
    description: 'Permit expiration timestamp in ISO-8601 format',
    example: '2027-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  permitExpiresAt?: string;

  @ApiPropertyOptional({
    description: 'Default city-level category switches (all real categories disabled by default)',
  })
  @IsOptional()
  @IsObject()
  categorySwitches?: Record<string, boolean>;

  @ApiProperty({
    description: 'City center latitude',
    example: 17.6868,
  })
  @IsNotEmpty()
  @IsNumber()
  centerLatitude!: number;

  @ApiProperty({
    description: 'City center longitude',
    example: 83.2185,
  })
  @IsNotEmpty()
  @IsNumber()
  centerLongitude!: number;
}

