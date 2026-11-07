import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OccPostureAudit } from '../../database/entities/occ-posture-audit.entity';
import {
  OccOperationalPosture,
  OccSystemHealthSummary,
  OccEscalationIncidentDto,
  OccPostureSwitchResult,
} from '@ecoride/contracts';

@Injectable()
export class OccCommandWallService {
  private currentPosture: OccOperationalPosture = OccOperationalPosture.NORMAL_CIVIL_OPERATION;

  constructor(
    @InjectRepository(OccPostureAudit)
    private readonly auditRepo: Repository<OccPostureAudit>,
  ) {}

  async getOccHealthSummary(): Promise<OccSystemHealthSummary> {
    return {
      activePassengerVehicles: 124,
      activeCargoVans: 38,
      activeMicroMobilityUnits: 95,
      chargingGunUtilizationPercent: 72.5,
      bessStoredEnergyKwh: 480.0,
      activeAlertsCount: this.currentPosture === OccOperationalPosture.NORMAL_CIVIL_OPERATION ? 0 : 3,
      posture: this.currentPosture,
      lastUpdated: new Date().toISOString(),
    };
  }

  async switchOperationalPosture(
    dto: OccEscalationIncidentDto,
    authorizedBy: string,
  ): Promise<OccPostureSwitchResult> {
    if (!authorizedBy) {
      throw new BadRequestException('Authorized incident commander ID is required to transition operational posture');
    }

    const previousPosture = this.currentPosture;
    this.currentPosture = dto.recommendedPosture;

    const affectedVehicleCount = dto.recommendedPosture === OccOperationalPosture.NORMAL_CIVIL_OPERATION ? 0 : 162;

    const audit = this.auditRepo.create({
      incidentCode: dto.incidentCode,
      previousPosture,
      newPosture: dto.recommendedPosture,
      authorizedBy,
      affectedVehicleCount,
      reason: `[${dto.severity}] ${dto.description} in zone ${dto.targetZone} (Milestone trigger: ${dto.sourceMilestone})`,
    });

    const saved = await this.auditRepo.save(audit);

    return {
      incidentId: saved.id,
      previousPosture,
      newPosture: saved.newPosture,
      activatedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
      authorizedBy: saved.authorizedBy,
      systemBroadcastSent: true,
      affectedVehicleCount,
    };
  }
}
