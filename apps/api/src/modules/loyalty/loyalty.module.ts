import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCode } from '../../database/entities/promo-code.entity';
import { UserReferral } from '../../database/entities/user-referral.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoCode, UserReferral, LedgerEntry]),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}

