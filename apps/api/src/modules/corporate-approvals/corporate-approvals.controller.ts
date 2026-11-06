import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CorporateApprovalsService } from './corporate-approvals.service';
import {
  CorporateRequisitionDto,
  ReviewCorporateRequisitionDto,
  CorporateRequisitionResult,
} from '@ecoride/contracts';
import { CorporateRequisition } from '../../database/entities/corporate-requisition.entity';

@Controller('corporate-approvals')
export class CorporateApprovalsController {
  constructor(private readonly approvalsService: CorporateApprovalsService) {}

  @Post('requisitions')
  async createRequisition(
    @Body() dto: CorporateRequisitionDto,
  ): Promise<CorporateRequisitionResult> {
    return await this.approvalsService.createRequisition(dto);
  }

  @Post('requisitions/review')
  async reviewRequisition(
    @Body() dto: ReviewCorporateRequisitionDto,
  ): Promise<CorporateRequisitionResult> {
    return await this.approvalsService.reviewRequisition(dto);
  }

  @Get('requisitions/:id')
  async getRequisition(@Param('id') id: string): Promise<CorporateRequisition> {
    return await this.approvalsService.getRequisition(id);
  }
}

