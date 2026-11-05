import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ForecastingService } from './forecasting.service';
import { ZoneDemandForecastDto, FleetRepositioningOrderDto } from '@ecoride/contracts';

@Controller('forecasting')
export class ForecastingController {
  constructor(private readonly forecastingService: ForecastingService) {}

  @Get('demand')
  @HttpCode(HttpStatus.OK)
  getForecasts(@Query('city') city?: string): Promise<ZoneDemandForecastDto[]> {
    return this.forecastingService.getZoneForecasts(city);
  }

  @Post('reposition')
  @HttpCode(HttpStatus.CREATED)
  createOrder(
    @Body()
    dto: {
      captainId: string;
      originZoneName: string;
      destinationZoneName: string;
      incentiveBonusPaise?: number;
    },
  ): Promise<FleetRepositioningOrderDto> {
    return this.forecastingService.createRepositioningOrder(dto);
  }

  @Post('reposition/:orderNumber/accept')
  @HttpCode(HttpStatus.OK)
  acceptOrder(@Param('orderNumber') orderNumber: string): Promise<FleetRepositioningOrderDto> {
    return this.forecastingService.acceptRepositioningOrder(orderNumber);
  }
}

