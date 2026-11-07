import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvasSoundTelemetry } from '../../database/entities/avas-sound-telemetry.entity';
import {
  AvasTelemetryDto,
  AvasComplianceResult,
  AvasSoundStatus,
} from '@ecoride/contracts';

@Injectable()
export class AvasTelemetryService {
  constructor(
    @InjectRepository(AvasSoundTelemetry)
    private readonly avasRepo: Repository<AvasSoundTelemetry>,
  ) {}

  async processTelemetry(dto: AvasTelemetryDto): Promise<AvasComplianceResult> {
    let status: AvasSoundStatus;
    let isCompliant = true;
    let pedestrianSafetyRisk = false;
    let penaltyPaise = 0;
    let notice: string;

    if (dto.speedKmph >= 20.0) {
      status = AvasSoundStatus.SPEED_ABOVE_THRESHOLD;
      isCompliant = true;
      pedestrianSafetyRisk = false;
      notice = 'Vehicle speed >= 20 km/h; natural tire-road acoustic interaction audible. AVAS chime idle.';
    } else {
      const isAudible = dto.isChimeEnabled && dto.acousticChimeDb >= 56.0;

      if (isAudible) {
        status = AvasSoundStatus.CHIME_ACTIVE;
        isCompliant = true;
        pedestrianSafetyRisk = false;
        notice = `Low-speed AVAS active (${dto.acousticChimeDb} dB(A)); compliant with AIS-173 pedestrian warning standards.`;
      } else {
        status = AvasSoundStatus.INFRACTION_MUTED;
        isCompliant = false;
        pedestrianSafetyRisk = true;

        if (dto.isPedestrianZone) {
          // Statutory penalty for silent EV in declared pedestrian zone: ₹500 (50,000 paise)
          penaltyPaise = 50000;
          notice =
            'CRITICAL INFRACTION: EV acoustic alert muted in dense pedestrian zone. Statutory ₹500 penalty logged.';
        } else {
          penaltyPaise = 0;
          notice =
            'WARNING: EV acoustic alert below statutory 56 dB(A) threshold at low speed. Immediate chime check required.';
        }
      }
    }

    const telemetry = this.avasRepo.create({
      vehicleId: dto.vehicleId,
      speedKmph: dto.speedKmph,
      acousticChimeDb: dto.acousticChimeDb,
      isChimeEnabled: dto.isChimeEnabled,
      isPedestrianZone: dto.isPedestrianZone,
      status,
      isCompliant,
      penaltyPaise,
    });

    await this.avasRepo.save(telemetry);

    return {
      vehicleId: dto.vehicleId,
      status,
      isCompliant,
      pedestrianSafetyRisk,
      penaltyPaise,
      notice,
    };
  }

  async getRecentLogs(vehicleId: string): Promise<AvasSoundTelemetry[]> {
    return await this.avasRepo.find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}

