import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EwayBillService } from './eway-bill.service';
import { EwayBillVerificationDto, EwayBillClearanceResult } from '@ecoride/contracts';
import { EwayBillRecord } from '../../database/entities/eway-bill-record.entity';

@Controller('eway-bill')
export class EwayBillController {
  constructor(private readonly ewayService: EwayBillService) {}

  @Post('clearance')
  async verifyCheckpost(
    @Body() dto: EwayBillVerificationDto,
  ): Promise<EwayBillClearanceResult> {
    return await this.ewayService.verifyAndClearCheckpost(dto);
  }

  @Get(':billNumber')
  async getRecord(@Param('billNumber') billNumber: string): Promise<EwayBillRecord> {
    return await this.ewayService.getRecord(billNumber);
  }
}

