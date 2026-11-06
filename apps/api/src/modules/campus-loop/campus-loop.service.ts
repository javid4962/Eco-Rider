import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { CampusShuttleSchedule } from '../../database/entities/campus-shuttle-schedule.entity';
import {
  CampusShuttleScheduleDto,
  CampusLoopBookingDto,
  CampusLoopBookingResult,
} from '@ecoride/contracts';

@Injectable()
export class CampusLoopService {
  constructor(
    @InjectRepository(CampusShuttleSchedule)
    private readonly scheduleRepo: Repository<CampusShuttleSchedule>,
  ) {}

  async createSchedule(dto: CampusShuttleScheduleDto): Promise<CampusShuttleSchedule> {
    const schedule = this.scheduleRepo.create({
      campusCode: dto.campusCode,
      loopName: dto.loopName,
      vehicleType: dto.vehicleType,
      operatingFrequencyMinutes: dto.operatingFrequencyMinutes,
      firstDepartureTime: dto.firstDepartureTime,
      lastDepartureTime: dto.lastDepartureTime,
      farePerRidePaise: dto.farePerRidePaise,
      isActive: true,
    });

    return await this.scheduleRepo.save(schedule);
  }

  async bookRide(dto: CampusLoopBookingDto): Promise<CampusLoopBookingResult> {
    const schedule = await this.scheduleRepo.findOne({ where: { id: dto.scheduleId } });
    if (!schedule) {
      throw new NotFoundException(`Campus schedule ${dto.scheduleId} not found`);
    }

    const token = `PASS-CAMPUS-${dto.campusCode.substring(0, 4)}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    return {
      bookingId: `BK-LOOP-${Date.now().toString(36).toUpperCase()}`,
      campusCode: dto.campusCode,
      assignedVehicleNumber: 'AP 16 EV 0442',
      etaMinutes: Math.floor(schedule.operatingFrequencyMinutes / 2),
      fareChargedPaise: schedule.farePerRidePaise,
      boardingPassQrToken: token,
      status: 'CONFIRMED',
    };
  }

  async getSchedulesByCampus(campusCode: string): Promise<CampusShuttleSchedule[]> {
    return await this.scheduleRepo.find({ where: { campusCode, isActive: true } });
  }
}
