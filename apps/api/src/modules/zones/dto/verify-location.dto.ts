import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerifyLocationRequest } from '@ecoride/contracts';

export class VerifyLocationDto implements VerifyLocationRequest {
  @ApiProperty({
    description: 'Operating hub city code in Andhra Pradesh (e.g. visakhapatnam, vijayawada)',
    example: 'visakhapatnam',
  })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiProperty({
    description: 'Candidate GPS latitude within Andhra Pradesh region',
    example: 17.6868,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Candidate GPS longitude within Andhra Pradesh region',
    example: 83.2185,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({
    description: 'Requested mobility service category or vehicle class (e.g. CITY_COMMUTE_2W, private_ev)',
    example: 'CITY_COMMUTE_2W',
  })
  @IsNotEmpty()
  @IsString()
  serviceCategory!: string;

  @ApiPropertyOptional({
    description: 'Simulated client payload flag attempting to forge category availability',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  clientForgedAvailability?: boolean;
}

