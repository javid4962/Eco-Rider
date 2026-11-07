import { Controller, Post, Body } from '@nestjs/common';
import { MultimodalFeederDiscountService } from './multimodal-feeder-discount.service';
import { FeederDiscountRequest, FeederDiscountCalculation, FeederDiscountClaim } from '@ecoride/contracts';

@Controller('v1/transit-feeder')
export class MultimodalFeederDiscountController {
  constructor(private readonly feederService: MultimodalFeederDiscountService) {}

  @Post('calculate-discount')
  calculateDiscount(@Body() body: FeederDiscountRequest): FeederDiscountCalculation {
    return this.feederService.calculateDiscount(body);
  }

  @Post('claim')
  async claimDiscount(@Body() body: FeederDiscountRequest): Promise<FeederDiscountClaim> {
    return this.feederService.claimDiscount(body);
  }
}
