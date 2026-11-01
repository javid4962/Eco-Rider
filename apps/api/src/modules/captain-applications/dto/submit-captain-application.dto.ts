import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubmitCaptainApplicationRequest } from '@ecoride/contracts';

export class SubmitCaptainApplicationDto implements SubmitCaptainApplicationRequest {
  @ApiPropertyOptional({
    example: 'All KYC certificates verified and green plate vehicle ready for inspection',
    description: 'Optional captain submission remarks',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
