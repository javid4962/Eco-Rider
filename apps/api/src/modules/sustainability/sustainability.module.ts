import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GreenCertificate } from '../../database/entities/green-certificate.entity';
import { Booking } from '../../database/entities/booking.entity';
import { SustainabilityService } from './sustainability.service';
import { SustainabilityController } from './sustainability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GreenCertificate, Booking]),
  ],
  controllers: [SustainabilityController],
  providers: [SustainabilityService],
  exports: [SustainabilityService],
})
export class SustainabilityModule {}

