import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HighwayChargingReservationDto,
  ReserveHighwaySlotDto,
  HighwaySlotStatus,
} from '@ecoride/contracts';
import { HighwayChargingReservation } from '../../database/entities/highway-charging-reservation.entity';

@Injectable()
export class HighwayFastChargingService {
  constructor(
    @InjectRepository(HighwayChargingReservation)
    private readonly reservationRepo: Repository<HighwayChargingReservation>,
  ) {}

  async reserveSlot(dto: ReserveHighwaySlotDto): Promise<HighwayChargingReservationDto> {
    if (!dto.vehicleRegistrationNumber || !dto.highwayPlazaId) {
      throw new BadRequestException('Vehicle registration number and highway plaza ID are required');
    }

    const startDate = new Date(dto.targetArrivalWindowStart);
    const endDate = new Date(dto.targetArrivalWindowEnd);
    if (endDate <= startDate) {
      throw new BadRequestException('Target arrival window end time must be after start time');
    }

    const reservationId = `HWY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const bayNumber = `BAY-${Math.floor(1 + Math.random() * 8).toString().padStart(2, '0')}`;

    const reservation = this.reservationRepo.create({
      reservationId,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      highwayPlazaId: dto.highwayPlazaId,
      highwayName: dto.highwayName || 'NH-16',
      bayNumber,
      targetArrivalWindowStart: startDate,
      targetArrivalWindowEnd: endDate,
      depositPaise: 10000, // ₹100.00 slot guarantee hold
      status: HighwaySlotStatus.RESERVED,
    });

    const saved = await this.reservationRepo.save(reservation);
    return this.mapToDto(saved);
  }

  async cancelReservation(reservationId: string): Promise<HighwayChargingReservationDto> {
    const res = await this.reservationRepo.findOne({ where: { reservationId } });
    if (!res) {
      throw new NotFoundException(`Highway reservation ${reservationId} not found`);
    }

    res.status = HighwaySlotStatus.NO_SHOW_CANCELLED;
    const saved = await this.reservationRepo.save(res);
    return this.mapToDto(saved);
  }

  private mapToDto(r: HighwayChargingReservation): HighwayChargingReservationDto {
    return {
      reservationId: r.reservationId,
      vehicleRegistrationNumber: r.vehicleRegistrationNumber,
      highwayPlazaId: r.highwayPlazaId,
      highwayName: r.highwayName,
      bayNumber: r.bayNumber,
      targetArrivalWindowStart: r.targetArrivalWindowStart.toISOString(),
      targetArrivalWindowEnd: r.targetArrivalWindowEnd.toISOString(),
      depositPaise: r.depositPaise,
      status: r.status as HighwaySlotStatus,
      reservedAt: r.reservedAt ? r.reservedAt.toISOString() : new Date().toISOString(),
    };
  }
}
