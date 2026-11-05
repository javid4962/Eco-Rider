import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../database/entities/booking.entity';
import { TaxInvoice } from '../../database/entities/tax-invoice.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      TaxInvoice,
      Vehicle,
      DriverProfile,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

