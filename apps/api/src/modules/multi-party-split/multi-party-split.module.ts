import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SplitPayoutBatch } from '../../database/entities/split-payout-batch.entity';
import { SplitPayoutItem } from '../../database/entities/split-payout-item.entity';
import { MultiPartySplitService } from './multi-party-split.service';
import { MultiPartySplitController } from './multi-party-split.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SplitPayoutBatch, SplitPayoutItem])],
  controllers: [MultiPartySplitController],
  providers: [MultiPartySplitService],
  exports: [MultiPartySplitService],
})
export class MultiPartySplitModule {}

