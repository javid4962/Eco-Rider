import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { NcmcTransitPaymentService } from './ncmc-transit-payment.service';
import { NcmcPaymentInitiationRequest, NcmcPaymentRecord } from '@ecoride/contracts';

@Controller('v1/ncmc')
export class NcmcTransitPaymentController {
  constructor(private readonly ncmcService: NcmcTransitPaymentService) {}

  @Post('process-payment')
  async processPayment(@Body() body: NcmcPaymentInitiationRequest): Promise<NcmcPaymentRecord> {
    return this.ncmcService.processPayment(body);
  }

  @Get('transactions/:transactionId')
  async getTransaction(@Param('transactionId') transactionId: string): Promise<NcmcPaymentRecord> {
    return this.ncmcService.getTransaction(transactionId);
  }
}

