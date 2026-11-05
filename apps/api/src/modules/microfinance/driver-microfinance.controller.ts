import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { DriverMicrofinanceService } from './driver-microfinance.service';
import {
  CaptainEmiPlanDto,
  ExecuteDailyEmiDeductionDto,
  EmiDeductionResultDto,
} from '@ecoride/contracts';

@Controller('microfinance')
export class DriverMicrofinanceController {
  constructor(private readonly financeService: DriverMicrofinanceService) {}

  @Get('captains/:captainId/plan')
  @HttpCode(HttpStatus.OK)
  getCaptainLoanPlan(
    @Param('captainId', ParseUUIDPipe) captainId: string,
  ): Promise<CaptainEmiPlanDto | null> {
    return this.financeService.getCaptainLoanPlan(captainId);
  }

  @Post('deductions/daily')
  @HttpCode(HttpStatus.OK)
  executeDailyDeduction(@Body() dto: ExecuteDailyEmiDeductionDto): Promise<EmiDeductionResultDto> {
    return this.financeService.executeDailyDeduction(dto);
  }
}

