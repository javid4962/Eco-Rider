import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CarbonCreditsService } from './carbon-credits.service';
import {
  CarbonCreditMintingBatchDto,
  MintedCarbonCreditBatchResult,
} from '@ecoride/contracts';
import { CarbonCreditBatch } from '../../database/entities/carbon-credit-batch.entity';

@Controller('carbon-credits')
export class CarbonCreditsController {
  constructor(private readonly creditsService: CarbonCreditsService) {}

  @Post('mint')
  async mintCredits(
    @Body() dto: CarbonCreditMintingBatchDto,
  ): Promise<MintedCarbonCreditBatchResult> {
    return await this.creditsService.mintCredits(dto);
  }

  @Get('batches/:identifier')
  async getBatch(
    @Param('identifier') identifier: string,
  ): Promise<CarbonCreditBatch> {
    return await this.creditsService.getBatch(identifier);
  }
}

