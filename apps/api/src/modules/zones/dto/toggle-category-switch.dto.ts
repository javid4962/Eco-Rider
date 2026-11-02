import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToggleCategorySwitchRequest } from '@ecoride/contracts';

export class ToggleCategorySwitchDto implements ToggleCategorySwitchRequest {
  @ApiProperty({
    description:
      'Target mobility category or vehicle class (e.g. CITY_COMMUTE_2W, scheduled_sharing)',
    example: 'CITY_COMMUTE_2W',
  })
  @IsNotEmpty()
  @IsString()
  serviceCategory!: string;

  @ApiProperty({
    description: 'Whether the service category is enabled in this zone',
    example: true,
  })
  @IsBoolean()
  isEnabled!: boolean;

  @ApiPropertyOptional({
    description: 'Evidence reference (e.g. pilot approval GO / safety permit id)',
    example: 'AP-RTO-VZG-CATEGORY-APPROVAL-01',
  })
  @IsOptional()
  @IsString()
  evidenceReference?: string;
}
