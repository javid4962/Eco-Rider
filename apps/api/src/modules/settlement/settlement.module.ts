import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutBatch } from '../../database/entities/payout-batch.entity';
import { PayoutItem } from '../../database/entities/payout-item.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { Booking } from '../../database/entities/booking.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayoutBatch,
      PayoutItem,
      LedgerEntry,
      Booking,
      DriverProfile,
    ]),
  ],
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}

