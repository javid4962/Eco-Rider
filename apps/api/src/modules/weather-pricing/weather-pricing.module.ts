import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherConditionLog } from '../../database/entities/weather-condition-log.entity';
import { WeatherPricingService } from './weather-pricing.service';
import { WeatherPricingController } from './weather-pricing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherConditionLog])],
  controllers: [WeatherPricingController],
  providers: [WeatherPricingService],
  exports: [WeatherPricingService],
})
export class WeatherPricingModule {}

