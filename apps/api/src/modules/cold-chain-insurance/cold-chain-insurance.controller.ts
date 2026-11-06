import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ColdChainInsuranceService } from './cold-chain-insurance.service';
import { ColdChainTelemetryDto } from '@ecoride/contracts';
import { ColdChainExcursionClaim } from '../../database/entities/cold-chain-excursion-claim.entity';

@Controller('cold-chain-insurance')
export class ColdChainInsuranceController {
  constructor(private readonly insuranceService: ColdChainInsuranceService) {}

  @Post('telemetry')
  async ingestTelemetry(@Body() dto: ColdChainTelemetryDto) {
    return await this.insuranceService.processTelemetry(dto);
  }

  @Get('claims/:ref')
  async getClaim(@Param('ref') ref: string): Promise<ColdChainExcursionClaim> {
    return await this.insuranceService.getClaimByReference(ref);
  }

  @Patch('claims/:ref/settle')
  async settleClaim(@Param('ref') ref: string): Promise<ColdChainExcursionClaim> {
    return await this.insuranceService.settleClaim(ref);
  }
}

