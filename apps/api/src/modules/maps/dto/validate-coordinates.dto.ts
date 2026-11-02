import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ValidateCoordinatesDto {
  @ApiProperty({
    description: 'Latitude to validate',
    example: 17.7142,
  })
  @IsNumber()
  latitude!: number;

  @ApiProperty({
    description: 'Longitude to validate',
    example: 83.3235,
  })
  @IsNumber()
  longitude!: number;
}
