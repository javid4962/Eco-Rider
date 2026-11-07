import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatterySecondLifeAssessment } from '../../database/entities/battery-second-life-assessment.entity';
import {
  BatteryHealthGrade,
  SecondLifeDutyRating,
  EvaluateSecondLifeDto,
  BatterySecondLifeAssessmentResult,
} from '@ecoride/contracts';

@Injectable()
export class BatterySecondLifeService {
  constructor(
    @InjectRepository(BatterySecondLifeAssessment)
    private readonly assessmentRepo: Repository<BatterySecondLifeAssessment>,
  ) {}

  async evaluateSecondLife(dto: EvaluateSecondLifeDto): Promise<BatterySecondLifeAssessmentResult> {
    if (dto.originalCapacityKwh <= 0 || dto.nominalResistanceMilliohm <= 0) {
      throw new BadRequestException('Capacity and nominal resistance must be greater than zero');
    }

    const soh = (dto.measuredCapacityKwh / dto.originalCapacityKwh) * 100;
    const resistanceRatio = dto.internalResistanceMilliohm / dto.nominalResistanceMilliohm;

    let healthGrade: BatteryHealthGrade;
    let assignedDuty: SecondLifeDutyRating;
    let isEligible = false;
    let recommendedMaxCrate = 0;
    let estimatedRemainingCycles = 0;

    if (soh >= 70) {
      healthGrade = BatteryHealthGrade.GRADE_A_AUTOMOTIVE;
      assignedDuty = SecondLifeDutyRating.REJECTED;
      isEligible = false;
      recommendedMaxCrate = 1.0;
      estimatedRemainingCycles = Math.max(0, 2000 - dto.cycleCount);
    } else if (soh >= 50 && resistanceRatio <= 1.8) {
      healthGrade = BatteryHealthGrade.GRADE_B_SECOND_LIFE;
      isEligible = true;
      if (dto.cellDegradationSpreadMv <= 30) {
        assignedDuty = SecondLifeDutyRating.DEPOT_STATIONARY_STORAGE;
        recommendedMaxCrate = 0.5;
      } else {
        assignedDuty = SecondLifeDutyRating.SOLAR_MICROGRID_BUFFER;
        recommendedMaxCrate = 0.25;
      }
      estimatedRemainingCycles = Math.max(0, Math.floor(3000 - dto.cycleCount * 0.6));
    } else {
      healthGrade = BatteryHealthGrade.GRADE_C_RECYCLE;
      assignedDuty = SecondLifeDutyRating.REJECTED;
      isEligible = false;
      recommendedMaxCrate = 0;
      estimatedRemainingCycles = 0;
    }

    const assessment = this.assessmentRepo.create({
      batterySerial: dto.batterySerial,
      originalVehicleId: dto.originalVehicleId,
      originalCapacityKwh: dto.originalCapacityKwh,
      measuredCapacityKwh: dto.measuredCapacityKwh,
      stateOfHealthPercent: Number(soh.toFixed(2)),
      resistanceRatio: Number(resistanceRatio.toFixed(2)),
      healthGrade,
      assignedDuty,
      isEligibleForSecondLife: isEligible,
      recommendedMaxCrate,
      cycleCount: dto.cycleCount,
    });

    const saved = await this.assessmentRepo.save(assessment);

    return {
      batterySerial: saved.batterySerial,
      originalVehicleId: saved.originalVehicleId,
      stateOfHealthPercent: Number(saved.stateOfHealthPercent),
      resistanceRatio: Number(saved.resistanceRatio),
      healthGrade: saved.healthGrade,
      assignedDuty: saved.assignedDuty,
      isEligibleForSecondLife: saved.isEligibleForSecondLife,
      recommendedMaxCrate: Number(saved.recommendedMaxCrate),
      estimatedRemainingCycles,
      assessedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async getAssessment(batterySerial: string): Promise<BatterySecondLifeAssessment | null> {
    return this.assessmentRepo.findOne({ where: { batterySerial } });
  }
}
