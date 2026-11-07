import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingCableThermalLogEntity } from '../../database/entities/charging-cable-thermal-log.entity';
import { CableThermalReading, CableThermalStatus, ThermalActionTaken } from '@ecoride/contracts';

@Injectable()
export class ChargingCableThermalSafeguardService {
  constructor(
    @InjectRepository(ChargingCableThermalLogEntity)
    private readonly logRepo: Repository<ChargingCableThermalLogEntity>,
  ) {}

  async evaluateThermalReading(reading: CableThermalReading): Promise<CableThermalStatus> {
    if (!reading.chargerBayId || !reading.vehicleId) {
      throw new BadRequestException('chargerBayId and vehicleId are required');
    }

    let actionTaken: ThermalActionTaken = 'NORMAL';
    let adjustedAmps = reading.targetAmps;
    let alertLevel: 'GREEN' | 'YELLOW' | 'CRITICAL' = 'GREEN';

    if (reading.cableTemperatureCelsius >= 85) {
      actionTaken = 'EMERGENCY_SHUTDOWN';
      adjustedAmps = 0;
      alertLevel = 'CRITICAL';
    } else if (reading.cableTemperatureCelsius >= 70) {
      actionTaken = 'THROTTLE_CURRENT';
      // Curtail charging current by 40%
      adjustedAmps = Math.round(reading.targetAmps * 0.6 * 10) / 10;
      alertLevel = 'YELLOW';
    }

    const log = this.logRepo.create({
      chargerBayId: reading.chargerBayId,
      vehicleId: reading.vehicleId,
      cableTemperatureCelsius: reading.cableTemperatureCelsius,
      ambientTemperatureCelsius: reading.ambientTemperatureCelsius,
      actionTaken,
      adjustedAmps,
      alertLevel,
    });

    const saved = await this.logRepo.save(log);

    return {
      id: saved.id,
      chargerBayId: saved.chargerBayId,
      vehicleId: saved.vehicleId,
      cableTemperatureCelsius: Number(saved.cableTemperatureCelsius),
      ambientTemperatureCelsius: Number(saved.ambientTemperatureCelsius),
      actionTaken: saved.actionTaken as ThermalActionTaken,
      adjustedAmps: Number(saved.adjustedAmps),
      alertLevel: saved.alertLevel as 'GREEN' | 'YELLOW' | 'CRITICAL',
      recordedAt: saved.recordedAt ? saved.recordedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getBayThermalLogs(chargerBayId: string): Promise<ChargingCableThermalLogEntity[]> {
    return this.logRepo.find({
      where: { chargerBayId },
      order: { recordedAt: 'DESC' },
      take: 20,
    });
  }
}

