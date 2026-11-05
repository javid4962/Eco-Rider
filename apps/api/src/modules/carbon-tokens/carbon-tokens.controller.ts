import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { CarbonTokensService } from './carbon-tokens.service';
import {
  CarbonTokenWalletDto,
  CarbonRewardProductDto,
  RedeemCarbonTokensDto,
  CarbonRedemptionReceiptDto,
} from '@ecoride/contracts';

@Controller('carbon-tokens')
export class CarbonTokensController {
  constructor(private readonly carbonService: CarbonTokensService) {}

  @Get('wallets/:userId')
  @HttpCode(HttpStatus.OK)
  getWallet(@Param('userId', ParseUUIDPipe) userId: string): Promise<CarbonTokenWalletDto> {
    return this.carbonService.getWallet(userId);
  }

  @Get('catalog')
  @HttpCode(HttpStatus.OK)
  getCatalog(): CarbonRewardProductDto[] {
    return this.carbonService.getCatalog();
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  redeemTokens(@Body() dto: RedeemCarbonTokensDto): Promise<CarbonRedemptionReceiptDto> {
    return this.carbonService.redeemTokens(dto);
  }
}

