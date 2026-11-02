import { IsNotEmpty, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EndFleetShiftRequest } from '@ecoride/contracts';

export class EndFleetShiftDto implements EndFleetShiftRequest {
  @ApiProperty({
    description: 'Final odometer reading in kilometers at shift handover',
    example: 12620,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  endOdometerKm!: number;

  @ApiProperty({
    description: 'Final battery State of Charge percentage at shift completion',
    example: 32.5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  endSocPercent!: number;

  @ApiPropertyOptional({
    description: 'Total verified trips completed during shift',
    example: 14,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalTrips?: number;

  @ApiPropertyOptional({
    description: 'Total gross shift passenger fares earned in paise',
    example: 285000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalEarningsPaise?: number;
}

