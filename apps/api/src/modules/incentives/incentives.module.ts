import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncentiveChallenge } from '../../database/entities/incentive-challenge.entity';
import { CaptainTierProgress } from '../../database/entities/captain-tier-progress.entity';
import { Booking } from '../../database/entities/booking.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { IncentivesService } from './incentives.service';
import { IncentivesController } from './incentives.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IncentiveChallenge,
      CaptainTierProgress,
      Booking,
      LedgerEntry,
    ]),
  ],
  controllers: [IncentivesController],
  providers: [IncentivesService],
  exports: [IncentivesService],
})
export class IncentivesModule {}

