import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { ZonesModule } from '../zones/zones.module';
import { FareRulesModule } from '../fare-rules/fare-rules.module';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { FareRule } from '../../database/entities/fare-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RideQuote, FareRule]), ZonesModule, FareRulesModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
