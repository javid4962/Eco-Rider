import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryFleetVehiclesDto {
  @ApiPropertyOptional({
    description: 'Filter vehicles by active roadworthiness status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isRoadworthy?: boolean;

  @ApiPropertyOptional({
    description: 'Filter vehicles by driver assignment state (true: assigned, false: idle)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  driverAssigned?: boolean;

  @ApiPropertyOptional({
    description:
      'Filter vehicles by vehicle category (e.g. CITY_COMMUTE_2W, AUTO_COMMUTE_3W, CAB_PRIVATE_4W)',
  })
  @IsOptional()
  @IsString()
  category?: string;
}
