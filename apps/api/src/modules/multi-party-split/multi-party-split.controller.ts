import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MultiPartySplitService } from './multi-party-split.service';
import { SplitPayoutBatchDto, ExecuteSplitPayoutDto } from '@ecoride/contracts';

@Controller('multi-party-split')
export class MultiPartySplitController {
  constructor(private readonly splitService: MultiPartySplitService) {}

  @Post('disburse')
  @HttpCode(HttpStatus.OK)
  executeSplitPayout(@Body() dto: ExecuteSplitPayoutDto): Promise<SplitPayoutBatchDto> {
    return this.splitService.executeSplitPayout(dto);
  }
}

