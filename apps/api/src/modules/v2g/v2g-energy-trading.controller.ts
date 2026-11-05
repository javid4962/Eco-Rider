import { Controller, Post, Body, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { V2gEnergyTradingService } from './v2g-energy-trading.service';
import {
  V2gDischargeSessionDto,
  InitiateV2gDischargeDto,
} from '@ecoride/contracts';

@Controller('v2g')
export class V2gEnergyTradingController {
  constructor(private readonly v2gService: V2gEnergyTradingService) {}

  @Post('discharge/initiate')
  @HttpCode(HttpStatus.CREATED)
  initiateDischarge(@Body() dto: InitiateV2gDischargeDto): Promise<V2gDischargeSessionDto> {
    return this.v2gService.initiateDischarge(dto);
  }

  @Put('discharge/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  completeDischarge(
    @Param('sessionId') sessionId: string,
    @Body() body: { actualExportedKwh: number },
  ): Promise<V2gDischargeSessionDto> {
    return this.v2gService.completeDischarge(sessionId, body.actualExportedKwh);
  }
}
