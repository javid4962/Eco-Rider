import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SmartChargingService } from './smart-charging.service';
import { OcppChargingProfileDto, TransformerLoadStatusDto, SetSmartChargingProfileDto } from '@ecoride/contracts';

@Controller('smart-charging')
export class SmartChargingController {
  constructor(private readonly chargingService: SmartChargingService) {}

  @Get('transformers/:stationId/load')
  @HttpCode(HttpStatus.OK)
  evaluateTransformerLoad(
    @Param('stationId') stationId: string,
    @Query('activeVehicles') activeVehicles?: string,
  ): Promise<TransformerLoadStatusDto> {
    const count = activeVehicles ? parseInt(activeVehicles, 10) : 4;
    return this.chargingService.evaluateTransformerLoad(stationId, count);
  }

  @Post('profiles')
  @HttpCode(HttpStatus.CREATED)
  setChargingProfile(@Body() dto: SetSmartChargingProfileDto): Promise<OcppChargingProfileDto> {
    return this.chargingService.setChargingProfile(dto);
  }
}

