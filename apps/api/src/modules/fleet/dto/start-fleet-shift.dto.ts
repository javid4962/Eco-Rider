import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FleetShiftType, StartFleetShiftRequest } from '@ecoride/contracts';

export class StartFleetShiftDto implements StartFleetShiftRequest {
  @ApiProperty({
    description: 'Vehicle UUID in the caller fleet organization',
    example: 'v1000000-0000-4000-8000-000000000001',
  })
  @IsNotEmpty()
  @IsUUID()
  vehicleId!: string;

  @ApiProperty({
    description: 'Assigned Driver / Captain User UUID',
    example: 'c1000000-0000-4000-8000-000000000001',
  })
  @IsNotEmpty()
  @IsUUID()
  driverUserId!: string;

  @ApiPropertyOptional({
    description: 'Operating shift window type',
    enum: FleetShiftType,
    default: FleetShiftType.MORNING,
  })
  @IsOptional()
  @IsEnum(FleetShiftType)
  shiftType?: FleetShiftType;

  @ApiPropertyOptional({
    description: 'Initial vehicle odometer reading in kilometers at shift commencement',
    example: 12500,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startOdometerKm?: number;

  @ApiPropertyOptional({
    description: 'Initial battery State of Charge percentage (must be >= 15%)',
    example: 95.0,
    default: 100.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  startSocPercent?: number;
}
