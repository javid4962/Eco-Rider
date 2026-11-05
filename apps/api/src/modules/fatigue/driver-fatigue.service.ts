import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FatigueRiskLevel,
  DriverDutyLogDto,
  IngestDriverFatigueTelemetryDto,
  FatigueLockoutStatusDto,
} from '@ecoride/contracts';
import { DriverDutyLog } from '../../database/entities/driver-duty-log.entity';

@Injectable()
export class DriverFatigueService {
  constructor(
    @InjectRepository(DriverDutyLog)
    private readonly dutyRepo: Repository<DriverDutyLog>,
  ) {}

  /**
   * Ingests driving telemetry and enforces AP statutory driver fatigue limits
   */
  async ingestTelemetry(dto: IngestDriverFatigueTelemetryDto): Promise<DriverDutyLogDto> {
    let log = await this.dutyRepo.findOne({ where: { captainId: dto.captainId } });
    const now = new Date();

    if (!log) {
      log = this.dutyRepo.create({
        captainId: dto.captainId,
        shiftStartTime: now,
        continuousDrivingMinutes: dto.sessionDrivingMinutes,
        totalDailyDrivingMinutes: dto.sessionDrivingMinutes,
        consecutiveRestMinutes: 0,
        fatigueRiskLevel: FatigueRiskLevel.NORMAL,
        isDispatchBlocked: false,
        lockoutExpiresAt: null,
      });
    } else {
      log.continuousDrivingMinutes += dto.sessionDrivingMinutes;
      log.totalDailyDrivingMinutes += dto.sessionDrivingMinutes;
    }

    const isExceededContinuous = log.continuousDrivingMinutes >= 270; // 4.5 hours continuous
    const isExceededDaily = log.totalDailyDrivingMinutes >= 600; // 10 hours daily
    const isSensorAlert = dto.drowsinessSensorAlert || (dto.erraticSteeringEventsCount ?? 0) >= 3;

    if (isExceededContinuous || isExceededDaily || isSensorAlert) {
      log.fatigueRiskLevel = FatigueRiskLevel.HIGH_MANDATORY_REST;
      log.isDispatchBlocked = true;
      log.lockoutExpiresAt = new Date(now.getTime() + 30 * 60000); // 30-minute mandatory rest
    } else if (log.continuousDrivingMinutes >= 210) {
      log.fatigueRiskLevel = FatigueRiskLevel.MODERATE_ADVISORY;
      log.isDispatchBlocked = false;
    } else {
      log.fatigueRiskLevel = FatigueRiskLevel.NORMAL;
      log.isDispatchBlocked = false;
    }

    const saved = await this.dutyRepo.save(log);
    return this.mapToDto(saved);
  }

  async checkFatigueStatus(captainId: string): Promise<FatigueLockoutStatusDto> {
    const log = await this.dutyRepo.findOne({ where: { captainId } });
    if (!log) {
      return {
        captainId,
        isBlocked: false,
        riskLevel: FatigueRiskLevel.NORMAL,
        remainingRestMinutes: 0,
        advisoryTelugu: 'మీరు ప్రయాణాన్ని ప్రారంభించడానికి సిద్ధంగా ఉన్నారు.',
        advisoryEnglish: 'You are well-rested and clear to accept rides.',
      };
    }

    const now = new Date();
    const isBlocked = log.isDispatchBlocked && log.lockoutExpiresAt !== null && log.lockoutExpiresAt > now;
    const remainingRestMinutes = isBlocked && log.lockoutExpiresAt
      ? Math.max(0, Math.ceil((log.lockoutExpiresAt.getTime() - now.getTime()) / 60000))
      : 0;

    return {
      captainId,
      isBlocked,
      riskLevel: log.fatigueRiskLevel as FatigueRiskLevel,
      remainingRestMinutes,
      advisoryTelugu: isBlocked
        ? `హెచ్చరిక: డ్రైవర్ భద్రత దృష్ట్యా 30 నిమిషాల విశ్రాంతి తప్పనిసరి. మిగిలిన సమయం: ${remainingRestMinutes} నిమిషాలు.`
        : 'మీ డ్యూటీ స్థితి సాధారణం.',
      advisoryEnglish: isBlocked
        ? `Mandatory 30-minute rest period active for fatigue safety. Remaining: ${remainingRestMinutes} mins.`
        : 'Driver duty status is normal.',
    };
  }

  private mapToDto(log: DriverDutyLog): DriverDutyLogDto {
    return {
      id: log.id,
      captainId: log.captainId,
      shiftStartTime: log.shiftStartTime.toISOString(),
      lastTripEndTime: log.lastTripEndTime?.toISOString(),
      continuousDrivingMinutes: log.continuousDrivingMinutes,
      totalDailyDrivingMinutes: log.totalDailyDrivingMinutes,
      consecutiveRestMinutes: log.consecutiveRestMinutes,
      fatigueRiskLevel: log.fatigueRiskLevel as FatigueRiskLevel,
      isDispatchBlocked: log.isDispatchBlocked,
      lockoutExpiresAt: log.lockoutExpiresAt?.toISOString(),
    };
  }
}

