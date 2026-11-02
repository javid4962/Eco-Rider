import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CoordinateDto } from './coordinate.dto';
import { RouteCalculationRequest } from '@ecoride/contracts';

export class RouteCalculationDto implements RouteCalculationRequest {
  @ApiProperty({
    description: 'Trip origin geographic coordinates',
    type: CoordinateDto,
  })
  @ValidateNested()
  @Type(() => CoordinateDto)
  origin!: CoordinateDto;

  @ApiProperty({
    description: 'Trip destination geographic coordinates',
    type: CoordinateDto,
  })
  @ValidateNested()
  @Type(() => CoordinateDto)
  destination!: CoordinateDto;

  @ApiPropertyOptional({
    description:
      'EV service category for specific energy estimation (e.g. CITY_COMMUTE_2W, CAB_PRIVATE_4W)',
    example: 'CITY_COMMUTE_2W',
  })
  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @ApiPropertyOptional({
    description: 'Whether to avoid toll roads in route calculation',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  avoidTolls?: boolean;
}
