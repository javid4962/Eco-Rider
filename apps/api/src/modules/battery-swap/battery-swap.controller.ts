import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BatterySwapService } from './battery-swap.service';
import {
  BatterySwapStationDto,
  ExecuteBatterySwapDto,
  BatterySwapReceiptDto,
  GridTariffWindowDto,
  SmartChargeRecommendationDto,
} from '@ecoride/contracts';

@Controller('battery-swap')
export class BatterySwapController {
  constructor(private readonly swapService: BatterySwapService) {}

  @Get('stations')
  @HttpCode(HttpStatus.OK)
  listStations(@Query('city') city?: string): Promise<BatterySwapStationDto[]> {
    return this.swapService.listStations(city);
  }

  @Post('swap')
  @HttpCode(HttpStatus.CREATED)
  executeSwap(@Body() dto: ExecuteBatterySwapDto): Promise<BatterySwapReceiptDto> {
    return this.swapService.executeSwap(dto);
  }

  @Get('grid-tariffs')
  @HttpCode(HttpStatus.OK)
  getGridTariffs(): Promise<GridTariffWindowDto[]> {
    return this.swapService.getGridTariffWindows();
  }

  @Get('smart-charge-recommendation')
  @HttpCode(HttpStatus.OK)
  getRecommendation(
    @Query('vehicleId') vehicleId?: string,
    @Query('currentSoc') currentSoc?: string,
  ): Promise<SmartChargeRecommendationDto> {
    const soc = currentSoc ? Number(currentSoc) : 25;
    return this.swapService.getSmartChargeRecommendation(vehicleId || 'veh-demo-01', soc);
  }
}

