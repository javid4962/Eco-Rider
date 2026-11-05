import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverFatigueEvent } from '../../database/entities/driver-fatigue-event.entity';
import {
  DmsCameraTelemetryDto,
  DmsFatigueAssessmentResult,
  FatigueSeverity,
} from '@ecoride/contracts';

@Injectable()
export class DmsFatigueService {
  constructor(
    @InjectRepository(DriverFatigueEvent)
    private readonly fatigueRepo: Repository<DriverFatigueEvent>,
  ) {}

  async assessFatigue(dto: DmsCameraTelemetryDto): Promise<DmsFatigueAssessmentResult> {
    const perclosFactor = dto.perclosPercent * 0.5;
    const yawnFactor = dto.yawnCountLastMinute * 8;
    const microSleepFactor = dto.microSleepDetected ? 40 : 0;
    const continuousFactor = dto.continuousDrivingMinutes > 180 ? 20 : 0;

    const rawScore = Math.round(
      perclosFactor + yawnFactor + microSleepFactor + continuousFactor,
    );
    const compositeFatigueScore = Math.min(100, Math.max(0, rawScore));

    let severity: FatigueSeverity;
    let hapticAlertTriggered = false;
    let mandatoryRestRequired = false;
    let restDurationMinutes = 0;
    let dispatchBlockedUntil: Date | undefined;
    let recommendation: string;

    if (compositeFatigueScore < 40) {
      severity = FatigueSeverity.NORMAL;
      recommendation = 'Captain alertness optimal. Safe to continue passenger transit.';
    } else if (compositeFatigueScore < 70) {
      severity = FatigueSeverity.MILD_DROWSINESS;
      hapticAlertTriggered = true;
      recommendation =
        'Mild drowsiness detected. Seat haptic pulse and auditory alert triggered. Recommend tea/water break.';
    } else {
      severity = FatigueSeverity.SEVERE_FATIGUE;
      hapticAlertTriggered = true;
      mandatoryRestRequired = true;
      restDurationMinutes = 30;
      dispatchBlockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      recommendation =
        'CRITICAL: Severe fatigue/micro-sleep detected. Dispatch automatically locked for 30 minutes.';
    }

    const event = this.fatigueRepo.create({
      captainId: dto.captainId,
      vehicleId: dto.vehicleId,
      perclosPercent: dto.perclosPercent,
      yawnCount: dto.yawnCountLastMinute,
      microSleepDetected: dto.microSleepDetected,
      compositeFatigueScore,
      severity,
      hapticAlertTriggered,
      mandatoryRestRequired,
      restDurationMinutes,
      dispatchBlockedUntil: dispatchBlockedUntil ?? null,
    });

    await this.fatigueRepo.save(event);

    return {
      captainId: dto.captainId,
      severity,
      compositeFatigueScore,
      hapticAlertTriggered,
      mandatoryRestRequired,
      restDurationMinutes,
      dispatchBlockedUntil: dispatchBlockedUntil?.toISOString(),
      recommendation,
    };
  }

  async getRecentEventsForCaptain(captainId: string): Promise<DriverFatigueEvent[]> {
    return await this.fatigueRepo.find({
      where: { captainId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}
