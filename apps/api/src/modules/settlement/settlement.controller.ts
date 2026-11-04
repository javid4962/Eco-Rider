import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CaptainEarningsSummaryDto,
  CreatePayoutBatchDto,
  ApprovePayoutBatchDto,
  PayoutBatchDto,
} from '@ecoride/contracts';

@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  /**
   * EV-055: Get Captain Earnings and Wallet Summary.
   */
  @Get('captains/:captainId/summary')
  async getCaptainSummary(
    @Param('captainId', ParseUUIDPipe) captainId: string,
  ): Promise<CaptainEarningsSummaryDto> {
    return this.settlementService.getCaptainEarningsSummary(captainId);
  }

  /**
   * EV-056: Propose Payout Batch.
   */
  @Post('batches/propose')
  @HttpCode(HttpStatus.CREATED)
  async proposeBatch(
    @Body() dto: CreatePayoutBatchDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<PayoutBatchDto> {
    return this.settlementService.createPayoutBatch(actor, dto);
  }

  /**
   * EV-056: Approve Payout Batch.
   */
  @Post('batches/:batchId/approve')
  @HttpCode(HttpStatus.OK)
  async approveBatch(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() dto?: ApprovePayoutBatchDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<PayoutBatchDto> {
    return this.settlementService.approvePayoutBatch(batchId, actor, dto);
  }

  /**
   * EV-056: Execute Payout Batch.
   */
  @Post('batches/:batchId/execute')
  @HttpCode(HttpStatus.OK)
  async executeBatch(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<PayoutBatchDto> {
    return this.settlementService.executePayoutBatch(batchId, actor);
  }

  /**
   * Get Payout Batch by ID with items.
   */
  @Get('batches/:batchId')
  async getBatch(
    @Param('batchId', ParseUUIDPipe) batchId: string,
  ): Promise<PayoutBatchDto> {
    return this.settlementService.getPayoutBatch(batchId);
  }

  /**
   * List recent payout batches.
   */
  @Get('batches')
  async listBatches(@Query('limit') limit?: number): Promise<PayoutBatchDto[]> {
    return this.settlementService.listPayoutBatches(limit ? Number(limit) : 20);
  }
}

