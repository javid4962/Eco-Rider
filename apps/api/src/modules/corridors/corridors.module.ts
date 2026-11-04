import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorridorRoute } from '../../database/entities/corridor-route.entity';
import { CorridorSchedule } from '../../database/entities/corridor-schedule.entity';
import { CorridorTrip } from '../../database/entities/corridor-trip.entity';
import { CorridorSeatReservation } from '../../database/entities/corridor-seat-reservation.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { CorridorsService } from './corridors.service';
import { CorridorsController } from './corridors.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorridorRoute,
      CorridorSchedule,
      CorridorTrip,
      CorridorSeatReservation,
      LedgerEntry,
    ]),
  ],
  controllers: [CorridorsController],
  providers: [CorridorsService],
  exports: [CorridorsService],
})
export class CorridorsModule {}

