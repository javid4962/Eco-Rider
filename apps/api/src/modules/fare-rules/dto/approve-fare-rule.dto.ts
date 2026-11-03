import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApproveFareRuleRequest } from '@ecoride/contracts';

export class ApproveFareRuleDto implements ApproveFareRuleRequest {
  @ApiProperty({
    description: 'Mandatory statutory gazette or regulatory permit order reference',
    example: 'AP-STA-2026-GO-42-PILOT-CORRIDOR',
  })
  @IsString()
  @IsNotEmpty()
  evidenceReference!: string;

  @ApiPropertyOptional({
    description: 'Optional reviewer notes or approval context',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
