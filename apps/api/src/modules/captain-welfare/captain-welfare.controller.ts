import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CaptainWelfareService } from './captain-welfare.service';
import {
  WelfareFundBalanceDto,
  MedicalClaimRequestDto,
  MedicalClaimDto,
} from '@ecoride/contracts';

@Controller('captain-welfare')
export class CaptainWelfareController {
  constructor(private readonly welfareService: CaptainWelfareService) {}

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  getFundBalance(): Promise<WelfareFundBalanceDto> {
    return this.welfareService.getFundBalance();
  }

  @Post('claims')
  @HttpCode(HttpStatus.CREATED)
  submitClaim(@Body() dto: MedicalClaimRequestDto): Promise<MedicalClaimDto> {
    return this.welfareService.submitMedicalClaim(dto);
  }

  @Post('claims/:claimNumber/disburse')
  @HttpCode(HttpStatus.OK)
  disburseClaim(
    @Param('claimNumber') claimNumber: string,
    @Body('approvedAmountPaise') approvedAmountPaise: number,
  ): Promise<MedicalClaimDto> {
    return this.welfareService.disburseMedicalClaim(claimNumber, approvedAmountPaise);
  }
}

