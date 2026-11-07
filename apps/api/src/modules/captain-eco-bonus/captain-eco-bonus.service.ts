import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptainEcoDrivingRecord } from '../../database/entities/captain-eco-driving-record.entity';
import {
  EcoDrivingTier,
  IngestEcoTripTelemetryDto,
  EcoPerformanceAssessmentResult,
} from '@ecoride/contracts';

@Injectable()
export class CaptainEcoBonusService {
  constructor(
    @InjectRepository(CaptainEcoDrivingRecord)
    private readonly ecoRepo: Repository<CaptainEcoDrivingRecord>,
  ) {}

  async evaluateTripPerformance(dto: IngestEcoTripTelemetryDto): Promise<EcoPerformanceAssessmentResult> {
    if (dto.energyConsumedKwh <= 0 || dto.totalDistanceKm <= 0) {
      throw new BadRequestException('Distance and energy consumed must be greater than zero');
    }

    const regenRatio = dto.regenEnergyRecoveredKwh / dto.energyConsumedKwh;

    let score = 100;
    score -= dto.hardBrakingEvents * 5;
    score -= dto.rapidAccelerationEvents * 5;

    if (regenRatio >= 0.2) {
      score += 10;
    }

    const finalScore = Math.min(100, Math.max(0, score));

    let tier: EcoDrivingTier;
    let bonusEligible = false;
    let bonusAmountPaise = 0;

    if (finalScore >= 85) {
      tier = EcoDrivingTier.EXEMPLARY_GREEN;
      bonusEligible = true;
      bonusAmountPaise = 150000; // ₹1,500 monthly green performance bonus
    } else if (finalScore >= 70) {
      tier = EcoDrivingTier.EFFICIENT_RIDER;
      bonusEligible = true;
      bonusAmountPaise = 50000; // ₹500 performance bonus
    } else {
      tier = EcoDrivingTier.STANDARD;
      bonusEligible = false;
      bonusAmountPaise = 0;
    }

    const record = this.ecoRepo.create({
      captainId: dto.captainId,
      vehicleId: dto.vehicleId,
      totalDistanceKm: dto.totalDistanceKm,
      regenEnergyRecoveredKwh: dto.regenEnergyRecoveredKwh,
      energyConsumedKwh: dto.energyConsumedKwh,
      ecoScore: finalScore,
      tier,
      bonusEligible,
      bonusAmountPaise,
    });

    const saved = await this.ecoRepo.save(record);

    return {
      captainId: saved.captainId,
      ecoScore: saved.ecoScore,
      tier: saved.tier,
      regenEfficiencyRatio: Number(regenRatio.toFixed(2)),
      monthlyBonusEligible: saved.bonusEligible,
      bonusAmountPaise: Number(saved.bonusAmountPaise),
      assessedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
