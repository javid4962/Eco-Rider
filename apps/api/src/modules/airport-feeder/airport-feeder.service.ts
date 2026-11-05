import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AirportFeederBooking } from '../../database/entities/airport-feeder-booking.entity';
import {
  AirportFeederBookingDto,
  FlightScheduleFeedDto,
  AirportFeederScheduleResult,
  FlightStatus,
} from '@ecoride/contracts';

@Injectable()
export class AirportFeederService {
  constructor(
    @InjectRepository(AirportFeederBooking)
    private readonly bookingRepo: Repository<AirportFeederBooking>,
  ) {}

  async createBooking(dto: AirportFeederBookingDto): Promise<AirportFeederBooking> {
    const scheduledTime = new Date(dto.scheduledArrival);

    // Dedicated airport EV feeder fare: Flat 45,000 paise (₹450.00) covering airport toll & luggage
    const farePaise = 45000 + (dto.luggageCount > 2 ? (dto.luggageCount - 2) * 5000 : 0);

    const bay = dto.terminalGate === 'GATE_2' ? 'EV_DEDICATED_BAY_02' : 'EV_DEDICATED_BAY_01';

    const booking = this.bookingRepo.create({
      riderId: dto.riderId,
      flightNumber: dto.flightNumber,
      airline: 'IndiGo / Air India',
      originIata: 'HYD',
      scheduledArrivalTime: scheduledTime,
      actualArrivalTime: scheduledTime,
      delayMinutes: 0,
      assignedPickupBay: bay,
      status: 'CONFIRMED',
      farePaise,
    });

    return await this.bookingRepo.save(booking);
  }

  async syncFlightUpdate(dto: FlightScheduleFeedDto): Promise<AirportFeederScheduleResult[]> {
    const bookings = await this.bookingRepo.find({
      where: { flightNumber: dto.flightNumber },
    });

    const results: AirportFeederScheduleResult[] = [];

    for (const b of bookings) {
      if (dto.status === FlightStatus.CANCELLED) {
        b.status = 'FLIGHT_CANCELLED_REFUNDED';
        await this.bookingRepo.save(b);

        results.push({
          bookingId: b.id,
          flightNumber: b.flightNumber,
          originalPickupTime: b.scheduledArrivalTime.toISOString(),
          adjustedPickupTime: b.scheduledArrivalTime.toISOString(),
          delayAdjustedMinutes: 0,
          assignedPickupBay: b.assignedPickupBay,
          farePaise: b.farePaise,
          status: 'FLIGHT_CANCELLED_REFUNDED',
        });
        continue;
      }

      const origTime = new Date(b.scheduledArrivalTime);
      const adjustedTime = new Date(origTime.getTime() + dto.delayMinutes * 60000);

      b.delayMinutes = dto.delayMinutes;
      b.actualArrivalTime = adjustedTime;
      b.status = dto.delayMinutes > 0 ? 'DELAY_ADJUSTED' : 'CONFIRMED';

      await this.bookingRepo.save(b);

      results.push({
        bookingId: b.id,
        flightNumber: b.flightNumber,
        originalPickupTime: origTime.toISOString(),
        adjustedPickupTime: adjustedTime.toISOString(),
        delayAdjustedMinutes: dto.delayMinutes,
        assignedPickupBay: b.assignedPickupBay,
        farePaise: b.farePaise,
        status: b.status as any,
      });
    }

    return results;
  }

  async getBooking(id: string): Promise<AirportFeederBooking> {
    const b = await this.bookingRepo.findOne({ where: { id } });
    if (!b) {
      throw new NotFoundException(`Airport booking ${id} not found`);
    }
    return b;
  }
}
