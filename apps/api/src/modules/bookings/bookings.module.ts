import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { RidesController } from './rides.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '../../database/entities/booking.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { RideStateEvent } from '../../database/entities/ride-state-event.entity';
import { RideIncident } from '../../database/entities/ride-incident.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { QuotesModule } from '../quotes/quotes.module';
import { ZonesModule } from '../zones/zones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, RideQuote, RideStateEvent, RideIncident, LedgerEntry]),
    QuotesModule,
    ZonesModule,
  ],
  controllers: [BookingsController, RidesController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
