import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';
import { GeoPoint } from '@ecoride/contracts';

export class CoordinateDto implements GeoPoint {
  @ApiProperty({
    description: 'Latitude in decimal degrees (-90 to +90)',
    example: 17.7142,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Longitude in decimal degrees (-180 to +180)',
    example: 83.3235,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

