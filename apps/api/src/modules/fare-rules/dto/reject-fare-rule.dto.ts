import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { RejectFareRuleRequest } from '@ecoride/contracts';

export class RejectFareRuleDto implements RejectFareRuleRequest {
  @ApiProperty({
    description: 'Mandatory reason for rejecting this proposed fare rule version',
    example: 'Proposed base fare violates AP statutory fare ceiling',
  })
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}
