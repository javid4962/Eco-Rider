import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolarCanopyReservation } from '../../database/entities/solar-canopy-reservation.entity';
import {
  CanopyReservationStatus,
  ReserveCanopySlotDto,
  CanopySlotReservationResult,
  CheckInCanopySessionDto,
} from '@ecoride/contracts';

@Injectable()
export class SolarCanopyReservationService {
  constructor(
    @InjectRepository(SolarCanopyReservation)
    private readonly reservationRepo: Repository<SolarCanopyReservation>,
  ) {}

  async reserveSlot(dto: ReserveCanopySlotDto): Promise<CanopySlotReservationResult> {
    if (dto.durationMinutes < 15 || dto.durationMinutes > 180) {
      throw new BadRequestException('Reservation duration must be between 15 and 180 minutes');
    }

    const slotStartTime = new Date(dto.slotStartTime);
    const slotEndTime = new Date(slotStartTime.getTime() + dto.durationMinutes * 60 * 1000);
    const bayNumber = `BAY-${Math.floor(1 + Math.random() * 8).toString().padStart(2, '0')}`;

    const reservation = this.reservationRepo.create({
      depotId: dto.depotId,
      bayType: dto.bayType,
      bayNumber,
      captainId: dto.captainId,
      vehicleId: dto.vehicleId,
      depositFeePaise: 5000, // ₹50 reservation deposit
      status: CanopyReservationStatus.RESERVED,
      slotStartTime,
      slotEndTime,
    });

    const saved = await this.reservationRepo.save(reservation);

    return {
      reservationId: saved.id,
      depotId: saved.depotId,
      bayType: saved.bayType,
      bayNumber: saved.bayNumber,
      captainId: saved.captainId,
      depositFeePaise: Number(saved.depositFeePaise),
      status: saved.status,
      slotStartTime: saved.slotStartTime.toISOString(),
      slotEndTime: saved.slotEndTime.toISOString(),
      plugInGracePeriodMinutes: 15,
    };
  }

  async checkInSession(dto: CheckInCanopySessionDto): Promise<SolarCanopyReservation> {
    const reservation = await this.reservationRepo.findOne({ where: { id: dto.reservationId } });
    if (!reservation) {
      throw new NotFoundException('Canopy reservation not found');
    }

    if (reservation.status !== CanopyReservationStatus.RESERVED) {
      throw new BadRequestException(`Reservation cannot be checked in: current status is ${reservation.status}`);
    }

    reservation.status = CanopyReservationStatus.PLUGGED_IN;
    return this.reservationRepo.save(reservation);
  }
}
