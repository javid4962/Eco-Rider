import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherGovernorEventEntity } from '../../database/entities/weather-governor-event.entity';
import { WeatherSpeedGovernorService } from './weather-speed-governor.service';
import { WeatherSpeedGovernorController } from './weather-speed-governor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherGovernorEventEntity])],
  controllers: [WeatherSpeedGovernorController],
  providers: [WeatherSpeedGovernorService],
  exports: [WeatherSpeedGovernorService],
})
export class WeatherSpeedGovernorModule {}

