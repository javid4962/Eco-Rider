import { Controller, Post, Body, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { LostFoundCustodyService } from './lost-found-custody.service';
import {
  LostItemCustodyDto,
  LogFoundItemDto,
  SecureInVaultDto,
  ClaimItemDto,
} from '@ecoride/contracts';

@Controller('lost-found-custody')
export class LostFoundCustodyController {
  constructor(private readonly custodyService: LostFoundCustodyService) {}

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  logFoundItem(@Body() dto: LogFoundItemDto): Promise<LostItemCustodyDto> {
    return this.custodyService.logFoundItem(dto);
  }

  @Put('items/secure-vault')
  @HttpCode(HttpStatus.OK)
  secureInVault(@Body() dto: SecureInVaultDto): Promise<LostItemCustodyDto> {
    return this.custodyService.secureInVault(dto);
  }

  @Put('items/claim')
  @HttpCode(HttpStatus.OK)
  claimItem(@Body() dto: ClaimItemDto): Promise<LostItemCustodyDto> {
    return this.custodyService.claimItem(dto);
  }
}

