import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { RidesController } from './rides.controller';
import { BookingsService } from './bookings.service';
import { InTripService } from './in-trip.service';
import { Booking } from '../../database/entities/booking.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { RideStateEvent } from '../../database/entities/ride-state-event.entity';
import { RideIncident } from '../../database/entities/ride-incident.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { DispatchOutboxEvent } from '../../database/entities/dispatch-outbox-event.entity';
import { QuotesModule } from '../quotes/quotes.module';
import { ZonesModule } from '../zones/zones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      RideQuote,
      RideStateEvent,
      RideIncident,
      LedgerEntry,
      DriverProfile,
      DispatchOutboxEvent,
    ]),
    QuotesModule,
    ZonesModule,
  ],
  controllers: [BookingsController, RidesController],
  providers: [BookingsService, InTripService],
  exports: [BookingsService, InTripService],
})
export class BookingsModule {}
