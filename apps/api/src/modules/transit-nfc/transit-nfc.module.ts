import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransitNfcService } from './transit-nfc.service';
import { TransitNfcController } from './transit-nfc.controller';
import { TransitSmartCard } from '../../database/entities/transit-smart-card.entity';
import { NfcTapTransaction } from '../../database/entities/nfc-tap-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransitSmartCard, NfcTapTransaction])],
  controllers: [TransitNfcController],
  providers: [TransitNfcService],
  exports: [TransitNfcService],
})
export class TransitNfcModule {}

