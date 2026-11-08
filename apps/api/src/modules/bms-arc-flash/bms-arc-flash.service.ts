import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BmsArcFlashEventEntity } from '../../database/entities/bms-arc-flash-event.entity';
import {
  EvaluateArcFlashTelemetryDto,
  ArcFlashHazardLevel,
} from '@ecoride/contracts';

@Injectable()
export class BmsArcFlashService {
  constructor(
    @InjectRepository(BmsArcFlashEventEntity)
    private readonly eventRepo: Repository<BmsArcFlashEventEntity>,
  ) {}

  async evaluateTelemetry(dto: EvaluateArcFlashTelemetryDto): Promise<BmsArcFlashEventEntity> {
    let hazardLevel = ArcFlashHazardLevel.NOMINAL;
    let contactorIsolationCommanded = false;
    let aerosolSuppressionArmed = false;
    let recommendedDriverAdvisory =
      'Pack operating within nominal thermal and impedance limits.';

    if (
      dto.maxCellDifferentialMilliVolts > 150 ||
      dto.temperatureRateOfRiseCelsiusPerSec > 2.0
    ) {
      hazardLevel = ArcFlashHazardLevel.EMERGENCY_ISOLATION_TRIGGERED;
      contactorIsolationCommanded = true;
      aerosolSuppressionArmed = true;
      recommendedDriverAdvisory =
        'CRITICAL_ARC_FLASH: Evacuate vehicle immediately. High-voltage pyrofuse blown and fire suppression armed.';
    } else if (
      dto.maxCellDifferentialMilliVolts > 50 ||
      dto.internalResistanceMilliOhms > 120
    ) {
      hazardLevel = ArcFlashHazardLevel.CRITICAL_PRECURSOR_DETECTED;
      contactorIsolationCommanded = true;
      aerosolSuppressionArmed = false;
      recommendedDriverAdvisory =
        'WARNING: High impedance arc precursor detected. Pull over safely. Main battery pack isolating.';
    }

    const record = this.eventRepo.create({
      vehicleId: dto.vehicleId,
      packSerial: dto.packSerial,
      packVoltage: dto.packVoltage,
      maxCellDifferentialMilliVolts: dto.maxCellDifferentialMilliVolts,
      internalResistanceMilliOhms: dto.internalResistanceMilliOhms,
      temperatureRateOfRiseCelsiusPerSec: dto.temperatureRateOfRiseCelsiusPerSec,
      hazardLevel,
      contactorIsolationCommanded,
      aerosolSuppressionArmed,
      recommendedDriverAdvisory,
      evaluatedAt: new Date(),
    });

    return this.eventRepo.save(record);
  }

  async getEvent(id: string): Promise<BmsArcFlashEventEntity> {
    const record = await this.eventRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`BMS arc flash event ${id} not found`);
    }
    return record;
  }
}
