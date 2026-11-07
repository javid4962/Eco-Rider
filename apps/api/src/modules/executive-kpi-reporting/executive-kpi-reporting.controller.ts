import { Body, Controller, Post } from '@nestjs/common';
import { ExecutiveKpiReportingService } from './executive-kpi-reporting.service';
import { GenerateDailyKpiReportDto } from '@ecoride/contracts';

@Controller('executive-kpi-reporting')
export class ExecutiveKpiReportingController {
  constructor(private readonly service: ExecutiveKpiReportingService) {}

  @Post('daily-report')
  async generateReport(@Body() dto: GenerateDailyKpiReportDto) {
    return this.service.generateDailyReport(dto);
  }
}
