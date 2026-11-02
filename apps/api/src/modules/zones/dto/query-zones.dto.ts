import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ZoneOperationalStatus } from '@ecoride/contracts';

export class QueryZonesDto {
  @ApiPropertyOptional({
    description: 'Filter by city code (e.g. visakhapatnam, vijayawada)',
    example: 'visakhapatnam',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by operational status',
    enum: ZoneOperationalStatus,
  })
  @IsOptional()
  @IsEnum(ZoneOperationalStatus)
  status?: ZoneOperationalStatus;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
