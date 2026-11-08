import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { IntercitySeatReservationEntity } from '../../database/entities/intercity-seat-reservation.entity';
import {
  ReserveIntercitySeatDto,
  IntercitySeatStatus,
} from '@ecoride/contracts';

@Injectable()
export class IntercityElectricTransitService {
  constructor(
    @InjectRepository(IntercitySeatReservationEntity)
    private readonly reservationRepo: Repository<IntercitySeatReservationEntity>,
  ) {}

  async reserveSeat(dto: ReserveIntercitySeatDto): Promise<IntercitySeatReservationEntity> {
    if (dto.requestedSeatNumber < 1 || dto.requestedSeatNumber > dto.maxCoachCapacity) {
      throw new BadRequestException(
        `Requested seat ${dto.requestedSeatNumber} exceeds coach capacity of ${dto.maxCoachCapacity}`,
      );
    }

    // 5% Passenger Transport GST (SAC 996412)
    const gstPaise = Math.round(dto.baseFarePaise * 0.05);
    const farePaidPaise = dto.baseFarePaise + gstPaise;

    const qrRaw = `${dto.passengerId}|${dto.route}|${dto.departureTime}|${dto.requestedSeatNumber}|${farePaidPaise}`;
    const qrBoardingPassPayload = `ECORIDE-PASS-${crypto.createHash('sha256').update(qrRaw).digest('hex').substring(0, 16).toUpperCase()}`;

    const record = this.reservationRepo.create({
      passengerId: dto.passengerId,
      route: dto.route,
      seatNumber: dto.requestedSeatNumber,
      farePaidPaise,
      gstPaise,
      status: IntercitySeatStatus.CONFIRMED,
      qrBoardingPassPayload,
      reservedAt: new Date(),
    });

    return this.reservationRepo.save(record);
  }

  async getReservation(id: string): Promise<IntercitySeatReservationEntity> {
    const record = await this.reservationRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Intercity seat reservation ${id} not found`);
    }
    return record;
  }
}
