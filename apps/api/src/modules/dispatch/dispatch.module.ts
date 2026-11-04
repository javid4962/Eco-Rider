import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchOffersController } from './dispatch-offers.controller';
import { DispatchOffersService } from './dispatch-offers.service';
import { DispatchOffersQueueService } from './dispatch-offers-queue.service';
import { DispatchOffer } from '../../database/entities/dispatch-offer.entity';
import { Booking } from '../../database/entities/booking.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { RideStateEvent } from '../../database/entities/ride-state-event.entity';
import { DispatchOutboxEvent } from '../../database/entities/dispatch-outbox-event.entity';
import { RedisModule } from '../redis/redis.module';
import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DispatchOffer,
      Booking,
      DriverProfile,
      Vehicle,
      RideStateEvent,
      DispatchOutboxEvent,
    ]),
    RedisModule,
    ComplianceModule,
  ],
  controllers: [DispatchOffersController],
  providers: [DispatchOffersService, DispatchOffersQueueService],
  exports: [DispatchOffersService, DispatchOffersQueueService],
})
export class DispatchModule {}
