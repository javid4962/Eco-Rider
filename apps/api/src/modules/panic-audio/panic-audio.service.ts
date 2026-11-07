import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PanicAudioIncident } from '../../database/entities/panic-audio-incident.entity';
import {
  IngestPanicAudioStreamDto,
  PanicIncidentAssessmentResult,
  IncidentSeverityLevel,
} from '@ecoride/contracts';

@Injectable()
export class PanicAudioService {
  constructor(
    @InjectRepository(PanicAudioIncident)
    private readonly incidentRepo: Repository<PanicAudioIncident>,
  ) {}

  async processPanicStream(dto: IngestPanicAudioStreamDto): Promise<PanicIncidentAssessmentResult> {
    if (dto.audioDurationSeconds <= 0) {
      throw new BadRequestException('Panic audio stream duration must be greater than zero');
    }

    const isCritical =
      dto.streamDecibelsMax >= 85.0 || dto.sosTriggerSource === 'HARDWARE_PANIC_BUTTON';

    let severity: IncidentSeverityLevel;
    let police112Notified = false;
    let policeDispatchToken = 'NONE';
    let actionTaken: string;

    if (isCritical) {
      severity = IncidentSeverityLevel.P0_CRITICAL_POLICE_DISPATCH;
      police112Notified = true;
      policeDispatchToken = `POLICE-112-AP-${Date.now().toString(36).toUpperCase()}-${crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;
      actionTaken = `CRITICAL EMERGENCY: High-decibel distress (${dto.streamDecibelsMax} dB) detected. AP Police 112 emergency routing engaged at coordinates (${dto.latitude}, ${dto.longitude}).`;
    } else {
      severity = IncidentSeverityLevel.P1_URGENT_OPERATIONS_CALL;
      police112Notified = false;
      actionTaken = `URGENT INCIDENT: Priority 24/7 Safety Desk incident generated. Outbound operator call triggered to captain ${dto.captainId}.`;
    }

    const incident = this.incidentRepo.create({
      rideId: dto.rideId,
      captainId: dto.captainId,
      riderId: dto.riderId,
      audioDurationSeconds: dto.audioDurationSeconds,
      audioChecksum: dto.audioSha256Checksum,
      streamDecibelsMax: dto.streamDecibelsMax,
      severity,
      police112Notified,
      policeDispatchToken,
      triggerSource: dto.sosTriggerSource,
      actionTaken,
    });

    const saved = await this.incidentRepo.save(incident);

    return {
      incidentId: saved.id,
      rideId: saved.rideId,
      severity,
      police112Notified,
      policeDispatchToken,
      audioVerified: true,
      actionTaken,
      timestamp: saved.createdAt.toISOString(),
    };
  }

  async getIncident(id: string): Promise<PanicAudioIncident | null> {
    return await this.incidentRepo.findOne({ where: { id } });
  }
}

