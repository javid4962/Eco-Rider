import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TransitNfcService } from './transit-nfc.service';
import {
  TransitSmartCardDto,
  NfcTapValidationDto,
  NfcTapResultDto,
  NfcCardType,
} from '@ecoride/contracts';

@Controller('transit-nfc')
export class TransitNfcController {
  constructor(private readonly nfcService: TransitNfcService) {}

  @Post('cards/register')
  @HttpCode(HttpStatus.CREATED)
  registerCard(
    @Body() body: { userId: string; cardUidHash: string; cardType: NfcCardType },
  ): Promise<TransitSmartCardDto> {
    return this.nfcService.registerCard(body.userId, body.cardUidHash, body.cardType);
  }

  @Post('taps/validate')
  @HttpCode(HttpStatus.OK)
  processNfcTap(@Body() dto: NfcTapValidationDto): Promise<NfcTapResultDto> {
    return this.nfcService.processNfcTap(dto);
  }
}

