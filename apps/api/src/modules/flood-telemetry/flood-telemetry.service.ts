import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FloodDepthAssessment } from '../../database/entities/flood-depth-assessment.entity';
import {
  FloodRiskSeverity,
  VehicleClearanceClass,
  IngestFloodDepthDto,
  FloodRerouteEvaluationResult,
} from '@ecoride/contracts';

@Injectable()
export class FloodTelemetryService {
  constructor(
    @InjectRepository(FloodDepthAssessment)
    private readonly floodRepo: Repository<FloodDepthAssessment>,
  ) {}

  async ingestFloodDepth(dto: IngestFloodDepthDto): Promise<FloodRerouteEvaluationResult> {
    if (dto.waterDepthMm < 0) {
      throw new BadRequestException('Water depth cannot be negative');
    }

    let severity: FloodRiskSeverity;
    const prohibitedClasses: VehicleClearanceClass[] = [];
    let isCorridorClosed = false;
    let recommendedDetour: string | null = null;

    if (dto.waterDepthMm < 100) {
      severity = FloodRiskSeverity.SAFE_DRY;
    } else if (dto.waterDepthMm <= 200) {
      severity = FloodRiskSeverity.LOW_WATER_CAUTION;
      if (dto.waterDepthMm > 150) {
        // Exceeds standard 4W sedan/hatchback AIS-038 wading depth (150mm)
        prohibitedClasses.push(VehicleClearanceClass.SEDAN_HATCHBACK_4W);
        recommendedDetour = 'Bypass low-lying culvert via Elevated Express Highway';
      }
    } else {
      severity = FloodRiskSeverity.CRITICAL_SUBMERSION_RISK;
      prohibitedClasses.push(VehicleClearanceClass.SEDAN_HATCHBACK_4W, VehicleClearanceClass.AUTO_RICKSHAW_3W);
      if (dto.waterDepthMm > 250) {
        prohibitedClasses.push(VehicleClearanceClass.SUV_PREMIUM_4W);
        isCorridorClosed = true;
        recommendedDetour = 'CRITICAL: Mandatory diversion via Amaravathi Inner Ring Flyover';
      } else {
        recommendedDetour = 'High-clearance electric SUVs only. Light EVs diverted to bypass corridor.';
      }
    }

    const record = this.floodRepo.create({
      corridorSegmentId: dto.corridorSegmentId,
      sensorLocation: dto.sensorLocation,
      waterDepthMm: dto.waterDepthMm,
      latitude: dto.latitude,
      longitude: dto.longitude,
      severity,
      isCorridorClosed,
      recommendedDetour,
    });

    const saved = await this.floodRepo.save(record);

    return {
      corridorSegmentId: saved.corridorSegmentId,
      waterDepthMm: saved.waterDepthMm,
      severity: saved.severity,
      prohibitedClasses,
      isCorridorClosed: saved.isCorridorClosed,
      recommendedDetour: saved.recommendedDetour,
      assessedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
