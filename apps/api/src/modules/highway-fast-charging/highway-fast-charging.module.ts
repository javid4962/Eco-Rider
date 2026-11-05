import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighwayFastChargingService } from './highway-fast-charging.service';
import { HighwayFastChargingController } from './highway-fast-charging.controller';
import { HighwayChargingReservation } from '../../database/entities/highway-charging-reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HighwayChargingReservation])],
  controllers: [HighwayFastChargingController],
  providers: [HighwayFastChargingService],
  exports: [HighwayFastChargingService],
})
export class HighwayFastChargingModule {}
