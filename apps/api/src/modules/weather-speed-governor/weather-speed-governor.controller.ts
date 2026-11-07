import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WeatherSpeedGovernorService } from './weather-speed-governor.service';
import { CorridorWeatherCondition, WeatherSpeedDirective } from '@ecoride/contracts';

@Controller('v1/speed-governor')
export class WeatherSpeedGovernorController {
  constructor(private readonly governorService: WeatherSpeedGovernorService) {}

  @Post('corridor-weather-update')
  async updateCorridorWeather(@Body() body: CorridorWeatherCondition): Promise<WeatherSpeedDirective> {
    return this.governorService.updateCorridorWeather(body);
  }

  @Get('corridors/:corridorId')
  async getCorridorLatestEvent(@Param('corridorId') corridorId: string) {
    return this.governorService.getCorridorLatestEvent(corridorId);
  }
}

