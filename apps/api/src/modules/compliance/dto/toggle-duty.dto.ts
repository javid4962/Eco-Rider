import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DutyStatus, ToggleDutyRequest } from '@ecoride/contracts';

export class ToggleDutyDto implements ToggleDutyRequest {
  @ApiProperty({
    enum: DutyStatus,
    example: DutyStatus.ONLINE,
    description: 'Target duty state for EV captain (ONLINE, OFFLINE)',
  })
  @IsEnum(DutyStatus, {
    message: 'Duty status must be one of: ONLINE, OFFLINE, ON_TRIP',
  })
  status!: DutyStatus;
}
