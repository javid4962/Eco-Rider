import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EvaluatePermissionDto {
  @ApiProperty({
    example: 'MARKETING_SMS',
    description:
      'Permission or purpose to evaluate (e.g. MARKETING_SMS, MARKETING_EMAIL, PROMOTIONAL_PUSH, LOCATION_NEARBY_OFFERS, LOCATION_TRIP_PROCESSING)',
  })
  @IsString()
  @IsNotEmpty()
  permission!: string;
}
