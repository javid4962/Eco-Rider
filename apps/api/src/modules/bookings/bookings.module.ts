import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '../../database/entities/booking.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { RideStateEvent } from '../../database/entities/ride-state-event.entity';
import { QuotesModule } from '../quotes/quotes.module';
import { ZonesModule } from '../zones/zones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, RideQuote, RideStateEvent]),
    QuotesModule,
    ZonesModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
