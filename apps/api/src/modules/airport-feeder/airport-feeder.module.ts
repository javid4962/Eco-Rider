import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AirportFeederBooking } from '../../database/entities/airport-feeder-booking.entity';
import { AirportFeederService } from './airport-feeder.service';
import { AirportFeederController } from './airport-feeder.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AirportFeederBooking])],
  controllers: [AirportFeederController],
  providers: [AirportFeederService],
  exports: [AirportFeederService],
})
export class AirportFeederModule {}

