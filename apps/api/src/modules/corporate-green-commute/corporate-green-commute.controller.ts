import { Body, Controller, Post } from '@nestjs/common';
import { CorporateGreenCommuteService } from './corporate-green-commute.service';
import { RecordGreenTripDto, CorporateOffsetPurchaseDto } from '@ecoride/contracts';

@Controller('corporate-green-commute')
export class CorporateGreenCommuteController {
  constructor(private readonly service: CorporateGreenCommuteService) {}

  @Post('record-trip')
  async recordTrip(@Body() dto: RecordGreenTripDto) {
    return this.service.recordGreenTrip(dto);
  }

  @Post('purchase-offset')
  async purchaseOffset(@Body() dto: CorporateOffsetPurchaseDto) {
    return this.service.purchaseCorporateOffset(dto);
  }
}

