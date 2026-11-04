import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassPlan } from '../../database/entities/pass-plan.entity';
import { CommuterPass } from '../../database/entities/commuter-pass.entity';
import { PassRedemption } from '../../database/entities/pass-redemption.entity';
import { CorridorSeatReservation } from '../../database/entities/corridor-seat-reservation.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { CommuterPassesService } from './commuter-passes.service';
import { CommuterPassesController } from './commuter-passes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PassPlan,
      CommuterPass,
      PassRedemption,
      CorridorSeatReservation,
      LedgerEntry,
    ]),
  ],
  controllers: [CommuterPassesController],
  providers: [CommuterPassesService],
  exports: [CommuterPassesService],
})
export class CommuterPassesModule {}

