import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneDemandForecast } from '../../database/entities/zone-demand-forecast.entity';
import { FleetRepositioningOrder } from '../../database/entities/fleet-repositioning-order.entity';
import { ForecastingService } from './forecasting.service';
import { ForecastingController } from './forecasting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ZoneDemandForecast, FleetRepositioningOrder])],
  controllers: [ForecastingController],
  providers: [ForecastingService],
  exports: [ForecastingService],
})
export class ForecastingModule {}

