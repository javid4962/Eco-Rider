import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarCanopyReservation } from '../../database/entities/solar-canopy-reservation.entity';
import { SolarCanopyReservationService } from './solar-canopy-reservation.service';
import { SolarCanopyReservationController } from './solar-canopy-reservation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SolarCanopyReservation])],
  controllers: [SolarCanopyReservationController],
  providers: [SolarCanopyReservationService],
  exports: [SolarCanopyReservationService],
})
export class SolarCanopyReservationModule {}
