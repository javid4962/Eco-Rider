import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  PlatformKpisDto,
  MonthlyGstReportDto,
  FleetUtilizationSummaryDto,
  DemandHeatmapPointDto,
} from '@ecoride/contracts';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  @HttpCode(HttpStatus.OK)
  getPlatformKpis(
    @Query('period') period?: string,
    @Query('city') city?: string,
  ): Promise<PlatformKpisDto> {
    return this.analyticsService.getPlatformKpis(period, city);
  }

  @Get('gst-report')
  @HttpCode(HttpStatus.OK)
  getMonthlyGstReport(@Query('month') month?: string): Promise<MonthlyGstReportDto> {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    return this.analyticsService.getMonthlyGstReport(targetMonth);
  }

  @Get('fleet-utilization')
  @HttpCode(HttpStatus.OK)
  getFleetUtilization(): Promise<FleetUtilizationSummaryDto> {
    return this.analyticsService.getFleetUtilization();
  }

  @Get('demand-heatmap')
  @HttpCode(HttpStatus.OK)
  getDemandHeatmap(@Query('city') city?: string): Promise<DemandHeatmapPointDto[]> {
    return this.analyticsService.getDemandHeatmap(city);
  }
}

