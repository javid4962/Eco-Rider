import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptainShiftErgonomics } from '../../database/entities/captain-shift-ergonomics.entity';
import {
  ShiftDutyStatus,
  RecordDutyHoursDto,
  ShiftErgonomicsResult,
  LogRestBreakDto,
} from '@ecoride/contracts';

@Injectable()
export class CaptainShiftErgonomicsService {
  constructor(
    @InjectRepository(CaptainShiftErgonomics)
    private readonly ergonomicsRepo: Repository<CaptainShiftErgonomics>,
  ) {}

  async recordDutyHours(dto: RecordDutyHoursDto): Promise<ShiftErgonomicsResult> {
    if (dto.continuousDrivingMinutes < 0 || dto.totalShiftMinutes < 0) {
      throw new BadRequestException('Duty minutes cannot be negative');
    }

    let record = await this.ergonomicsRepo.findOne({ where: { captainId: dto.captainId } });

    if (!record) {
      record = this.ergonomicsRepo.create({
        captainId: dto.captainId,
        continuousDrivingMinutes: dto.continuousDrivingMinutes,
        totalShiftMinutes: dto.totalShiftMinutes,
        dutyStatus: ShiftDutyStatus.ACTIVE_ON_DUTY,
      });
    } else {
      record.continuousDrivingMinutes = dto.continuousDrivingMinutes;
      record.totalShiftMinutes = dto.totalShiftMinutes;
    }

    let isDispatchEligible = true;
    let requiredRestMinutesRemaining = 0;
    let cooldownExpiry: Date | null = null;
    let message = 'Shift active and dispatch eligible.';

    if (dto.continuousDrivingMinutes >= 240) {
      // 4 hours continuous driving breach
      record.dutyStatus = ShiftDutyStatus.MANDATORY_REST_REQUIRED;
      isDispatchEligible = false;
      requiredRestMinutesRemaining = 30;
      cooldownExpiry = new Date(Date.now() + 30 * 60 * 1000);
      record.cooldownExpiry = cooldownExpiry;
      message = 'Statutory 4-hour continuous driving limit reached. Mandatory 30-minute rest break required.';
    } else if (dto.totalShiftMinutes >= 600) {
      // 10 hours daily shift breach
      record.dutyStatus = ShiftDutyStatus.SHIFT_LIMIT_REACHED;
      isDispatchEligible = false;
      requiredRestMinutesRemaining = 480;
      cooldownExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);
      record.cooldownExpiry = cooldownExpiry;
      message = 'Maximum daily 10-hour shift limit reached. Shift ended for 8-hour rest.';
    } else {
      record.dutyStatus = ShiftDutyStatus.ACTIVE_ON_DUTY;
      record.cooldownExpiry = null;
    }

    const saved = await this.ergonomicsRepo.save(record);

    return {
      captainId: saved.captainId,
      continuousDrivingMinutes: saved.continuousDrivingMinutes,
      totalShiftMinutes: saved.totalShiftMinutes,
      dutyStatus: saved.dutyStatus,
      isDispatchEligible,
      requiredRestMinutesRemaining,
      cooldownExpiry: saved.cooldownExpiry ? saved.cooldownExpiry.toISOString() : null,
      message,
    };
  }

  async logRestBreak(dto: LogRestBreakDto): Promise<ShiftErgonomicsResult> {
    let record = await this.ergonomicsRepo.findOne({ where: { captainId: dto.captainId } });
    if (!record) {
      record = this.ergonomicsRepo.create({
        captainId: dto.captainId,
        continuousDrivingMinutes: 0,
        totalShiftMinutes: 0,
        dutyStatus: ShiftDutyStatus.ACTIVE_ON_DUTY,
      });
    }

    if (dto.breakDurationMinutes >= 30) {
      record.continuousDrivingMinutes = 0;
      record.dutyStatus = ShiftDutyStatus.ACTIVE_ON_DUTY;
      record.cooldownExpiry = null;
      record.lastRestHubId = dto.restHubId;
    }

    const saved = await this.ergonomicsRepo.save(record);

    return {
      captainId: saved.captainId,
      continuousDrivingMinutes: saved.continuousDrivingMinutes,
      totalShiftMinutes: saved.totalShiftMinutes,
      dutyStatus: saved.dutyStatus,
      isDispatchEligible: saved.dutyStatus === ShiftDutyStatus.ACTIVE_ON_DUTY,
      requiredRestMinutesRemaining: 0,
      cooldownExpiry: null,
      message: 'Rest break verified and logged. Steering clock reset to 0.',
    };
  }
}
