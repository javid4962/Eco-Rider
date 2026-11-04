import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CaptainAvailabilityStatus } from '@ecoride/contracts';

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Target captain availability status',
    enum: CaptainAvailabilityStatus,
    example: CaptainAvailabilityStatus.AVAILABLE,
  })
  @IsEnum(CaptainAvailabilityStatus)
  @IsNotEmpty()
  status!: CaptainAvailabilityStatus;

  @ApiPropertyOptional({
    description: 'Optional operational reason or depot note (e.g. Charging at MVP Colony depot)',
    example: 'Charging at Visakhapatnam EV Hub',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Current battery State of Charge percentage (0-100)',
    example: 85.0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batterySocPercent?: number;
}
