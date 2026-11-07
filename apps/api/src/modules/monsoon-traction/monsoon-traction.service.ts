import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonsoonTractionEvent } from '../../database/entities/monsoon-traction-event.entity';
import {
  RoadConditionState,
  MonsoonAdaptiveMode,
  RoadSurfaceTelemetryDto,
  MonsoonTractionControlResult,
} from '@ecoride/contracts';

@Injectable()
export class MonsoonTractionService {
  constructor(
    @InjectRepository(MonsoonTractionEvent)
    private readonly tractionRepo: Repository<MonsoonTractionEvent>,
  ) {}

  async evaluateRoadCondition(dto: RoadSurfaceTelemetryDto): Promise<MonsoonTractionControlResult> {
    if (dto.surfaceFrictionMu < 0 || dto.surfaceFrictionMu > 1.2) {
      throw new BadRequestException('Friction coefficient mu must be between 0.0 and 1.2');
    }

    let roadCondition: RoadConditionState;
    let recommendedMode: MonsoonAdaptiveMode;
    let maxTorqueLimitPercent = 100;
    let maxSpeedLimitKmh = 80;
    let warningAlert: string | null = null;

    if (dto.surfaceFrictionMu >= 0.6 && dto.wheelSlipPercent <= 5) {
      roadCondition = RoadConditionState.DRY_HIGH_TRACTION;
      recommendedMode = MonsoonAdaptiveMode.NORMAL_DRIVE;
      maxTorqueLimitPercent = 100;
      maxSpeedLimitKmh = 80;
      warningAlert = null;
    } else if (dto.surfaceFrictionMu >= 0.35 && dto.wheelSlipPercent <= 12 && dto.rainSensorMmPerHour <= 30) {
      roadCondition = RoadConditionState.WET_ASPHALT_MODERATE;
      recommendedMode = MonsoonAdaptiveMode.TRACTION_STABILITY_ASSIST;
      maxTorqueLimitPercent = 70;
      maxSpeedLimitKmh = 50;
      warningAlert = 'Wet monsoon road conditions detected. Electronic stability & traction assist active.';
    } else {
      roadCondition = RoadConditionState.FLOODED_HYDROPLANE_RISK;
      recommendedMode = MonsoonAdaptiveMode.EXTREME_MONSOON_CRAWL;
      maxTorqueLimitPercent = 40;
      maxSpeedLimitKmh = 30;
      warningAlert = 'CRITICAL: Hydroplaning / flooded roadway risk. Motor torque capped to 40% and speed limited to 30 km/h.';
    }

    const event = this.tractionRepo.create({
      vehicleId: dto.vehicleId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      surfaceFrictionMu: dto.surfaceFrictionMu,
      wheelSlipPercent: dto.wheelSlipPercent,
      roadCondition,
      adaptiveMode: recommendedMode,
      maxTorqueLimitPercent,
      maxSpeedLimitKmh,
    });

    const saved = await this.tractionRepo.save(event);

    return {
      vehicleId: saved.vehicleId,
      roadCondition: saved.roadCondition,
      recommendedMode: saved.adaptiveMode,
      maxTorqueLimitPercent: saved.maxTorqueLimitPercent,
      maxSpeedLimitKmh: saved.maxSpeedLimitKmh,
      warningAlert,
      timestamp: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
