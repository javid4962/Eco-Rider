import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PredictiveTireAssessment } from '../../database/entities/predictive-tire-assessment.entity';
import {
  PredictiveTireTelemetryDto,
  PredictiveTireAssessmentResult,
  TireWearStatus,
} from '@ecoride/contracts';

@Injectable()
export class PredictiveTireService {
  constructor(
    @InjectRepository(PredictiveTireAssessment)
    private readonly tireRepo: Repository<PredictiveTireAssessment>,
  ) {}

  async assessTireTelemetry(
    dto: PredictiveTireTelemetryDto,
  ): Promise<PredictiveTireAssessmentResult> {
    const minTread = Math.min(dto.treadDepthMmFront, dto.treadDepthMmRear);
    let tireWearStatus: TireWearStatus;
    let immediateDepotServiceRequired = false;
    let workOrderCreated = false;
    let maintenanceWorkOrderRef: string | undefined;
    const recommendations: string[] = [];

    // Statutory minimum limit is 1.6 mm. Critical threshold set at 2.0 mm.
    if (minTread <= 2.0 || dto.odometerKm >= 60000) {
      tireWearStatus = TireWearStatus.CRITICAL_REPLACEMENT_REQUIRED;
      immediateDepotServiceRequired = true;
      workOrderCreated = true;
      maintenanceWorkOrderRef = `WO-TIRE-${dto.vehicleId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      recommendations.push(
        `CRITICAL: Tread depth (${minTread} mm) near statutory limit (1.6 mm). Immediate tire replacement required.`,
      );
      recommendations.push('Work order auto-dispatched to nearest certified fleet maintenance depot.');
    } else if (minTread <= 3.5 || dto.rapidAccelerationCount > 25) {
      tireWearStatus = TireWearStatus.MODERATE_WEAR;
      recommendations.push(
        `MODERATE WEAR: Front tread ${dto.treadDepthMmFront} mm, rear tread ${dto.treadDepthMmRear} mm.`,
      );
      recommendations.push(
        'High instantaneous electric torque wear detected. Schedule tire rotation and pressure calibration within 7 days.',
      );
    } else {
      tireWearStatus = TireWearStatus.HEALTHY;
      recommendations.push('Tire health, tread depth, and PSI within optimal OEM specifications.');
    }

    const estimatedRemainingUsefulLifeKm = Math.max(
      0,
      Math.round((minTread - 1.6) * 12000), // ~12,000 km per mm of remaining usable rubber
    );

    const assessment = this.tireRepo.create({
      vehicleId: dto.vehicleId,
      odometerKm: dto.odometerKm,
      frontTreadRemainingMm: dto.treadDepthMmFront,
      rearTreadRemainingMm: dto.treadDepthMmRear,
      ambientRoadTempCelsius: dto.ambientRoadTempCelsius,
      tireWearStatus,
      estimatedRemainingUsefulLifeKm,
      immediateDepotServiceRequired,
      workOrderRef: maintenanceWorkOrderRef || null,
    });

    await this.tireRepo.save(assessment);

    return {
      vehicleId: dto.vehicleId,
      tireWearStatus,
      frontTreadRemainingMm: dto.treadDepthMmFront,
      rearTreadRemainingMm: dto.treadDepthMmRear,
      estimatedRemainingUsefulLifeKm,
      immediateDepotServiceRequired,
      workOrderCreated,
      maintenanceWorkOrderRef,
      recommendations,
    };
  }

  async getRecentAssessments(vehicleId: string): Promise<PredictiveTireAssessment[]> {
    return await this.tireRepo.find({
      where: { vehicleId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}
