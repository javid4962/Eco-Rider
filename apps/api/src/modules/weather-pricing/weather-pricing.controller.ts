import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WeatherPricingService } from './weather-pricing.service';
import {
  WeatherConditionDto,
  WeatherAdaptiveFareResultDto,
} from '@ecoride/contracts';

@Controller('weather-pricing')
export class WeatherPricingController {
  constructor(private readonly weatherService: WeatherPricingService) {}

  @Get('current')
  @HttpCode(HttpStatus.OK)
  getCurrentWeather(
    @Query('zone') zone: string,
    @Query('city') city?: string,
  ): Promise<WeatherConditionDto> {
    return this.weatherService.getCurrentWeather(zone, city || 'Vijayawada');
  }

  @Get('calculate')
  @HttpCode(HttpStatus.OK)
  calculateWeatherFare(
    @Query('baseFarePaise') baseFarePaise: string,
    @Query('zone') zone: string,
    @Query('city') city?: string,
  ): Promise<WeatherAdaptiveFareResultDto> {
    return this.weatherService.calculateWeatherFare(parseInt(baseFarePaise, 10), zone, city || 'Vijayawada');
  }

  @Post('update')
  @HttpCode(HttpStatus.OK)
  recordWeatherUpdate(@Body() dto: WeatherConditionDto): Promise<void> {
    return this.weatherService.recordWeatherUpdate(dto);
  }
}

