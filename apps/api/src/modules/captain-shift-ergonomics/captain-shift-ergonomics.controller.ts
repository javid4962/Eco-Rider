import { Body, Controller, Post } from '@nestjs/common';
import { CaptainShiftErgonomicsService } from './captain-shift-ergonomics.service';
import { RecordDutyHoursDto, LogRestBreakDto } from '@ecoride/contracts';

@Controller('captain-shift-ergonomics')
export class CaptainShiftErgonomicsController {
  constructor(private readonly service: CaptainShiftErgonomicsService) {}

  @Post('record-duty')
  async recordDuty(@Body() dto: RecordDutyHoursDto) {
    return this.service.recordDutyHours(dto);
  }

  @Post('log-break')
  async logBreak(@Body() dto: LogRestBreakDto) {
    return this.service.logRestBreak(dto);
  }
}
