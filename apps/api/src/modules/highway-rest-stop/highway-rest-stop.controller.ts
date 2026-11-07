import { Body, Controller, Post } from '@nestjs/common';
import { HighwayRestStopService } from './highway-rest-stop.service';
import { IssueRestStopVoucherDto, RedeemRestStopVoucherDto } from '@ecoride/contracts';

@Controller('highway-rest-stop')
export class HighwayRestStopController {
  constructor(private readonly service: HighwayRestStopService) {}

  @Post('issue-voucher')
  async issueVoucher(@Body() dto: IssueRestStopVoucherDto) {
    return this.service.issueVoucher(dto);
  }

  @Post('redeem-voucher')
  async redeemVoucher(@Body() dto: RedeemRestStopVoucherDto) {
    return this.service.redeemVoucher(dto);
  }
}

