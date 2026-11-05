import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CorporateSubsidyService } from './corporate-subsidy.service';
import { CalculateSubsidyRequestDto, SubsidyBreakdownDto } from '@ecoride/contracts';

@Controller('corporate-subsidy')
export class CorporateSubsidyController {
  constructor(private readonly subsidyService: CorporateSubsidyService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  calculateSubsidy(@Body() dto: CalculateSubsidyRequestDto): Promise<SubsidyBreakdownDto> {
    return this.subsidyService.calculateSubsidy(dto);
  }
}

