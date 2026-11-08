import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntercitySeatReservationEntity } from '../../database/entities/intercity-seat-reservation.entity';
import { IntercityElectricTransitService } from './intercity-electric-transit.service';
import { IntercityElectricTransitController } from './intercity-electric-transit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IntercitySeatReservationEntity])],
  controllers: [IntercityElectricTransitController],
  providers: [IntercityElectricTransitService],
  exports: [IntercityElectricTransitService],
})
export class IntercityElectricTransitModule {}

