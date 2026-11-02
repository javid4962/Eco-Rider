import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateVehicleOperationRequest } from '@ecoride/contracts';

export class ValidateVehicleOperationDto implements ValidateVehicleOperationRequest {
  @ApiPropertyOptional({
    example: 3,
    description: 'Number of passenger seats requested for commercial operation (customer seats)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  requestedSeats?: number;

  @ApiPropertyOptional({
    example: 'AUTO_COMMUTE_3W',
    description: 'Requested vehicle service class or category (e.g. ECO_AUTO, AUTO_COMMUTE_3W)',
  })
  @IsOptional()
  @IsString()
  serviceClass?: string;

  @ApiPropertyOptional({
    example: 'visakhapatnam',
    description: 'Intended operational city/municipality',
  })
  @IsOptional()
  @IsString()
  city?: string;
}
