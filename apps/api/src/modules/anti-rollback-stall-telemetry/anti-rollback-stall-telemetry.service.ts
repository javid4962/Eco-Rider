import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AntiRollbackStallEventEntity } from '../../database/entities/anti-rollback-stall-event.entity';
import {
  InclineTelemetryReading,
  AntiRollbackInterventionResult,
  RollbackSeverity,
} from '@ecoride/contracts';

@Injectable()
export class AntiRollbackStallTelemetryService {
  constructor(
    @InjectRepository(AntiRollbackStallEventEntity)
    private readonly eventRepo: Repository<AntiRollbackStallEventEntity>,
  ) {}

  async evaluateRollback(reading: InclineTelemetryReading): Promise<AntiRollbackInterventionResult> {
    if (!reading.vehicleId) {
      throw new BadRequestException('vehicleId is required');
    }

    let rollbackDetected = false;
    let severity: RollbackSeverity = 'NORMAL';
    let holdingTorqueBoostNm = 0;
    let hillStartAssistActive = false;
    let alertIssued = false;

    // Detect backward slip on positive incline while trying to move forward
    if (reading.inclineGradeAngleDegrees >= 4.0 && reading.vehicleSpeedKmph < -0.5) {
      rollbackDetected = true;
      hillStartAssistActive = true;

      if (reading.vehicleSpeedKmph <= -2.0 || reading.grossVehicleWeightKg > 750) {
        severity = 'CRITICAL_STALL_WARNING';
        holdingTorqueBoostNm = 85.0; // Max holding torque override to lock wheels
        alertIssued = true;
      } else {
        severity = 'MINOR_SLIP';
        holdingTorqueBoostNm = 45.0;
        alertIssued = false;
      }
    }

    const event = this.eventRepo.create({
      vehicleId: reading.vehicleId,
      flyoverName: reading.flyoverName || 'Kanaka Durga Flyover',
      rollbackDetected,
      severity,
      holdingTorqueBoostNm,
      hillStartAssistActive,
      alertIssued,
    });

    const saved = await this.eventRepo.save(event);

    return {
      id: saved.id,
      vehicleId: saved.vehicleId,
      flyoverName: saved.flyoverName,
      rollbackDetected: saved.rollbackDetected,
      severity: saved.severity as RollbackSeverity,
      holdingTorqueBoostNm: Number(saved.holdingTorqueBoostNm),
      hillStartAssistActive: saved.hillStartAssistActive,
      alertIssued: saved.alertIssued,
      timestamp: saved.timestamp ? saved.timestamp.toISOString() : new Date().toISOString(),
    };
  }

  async getVehicleEvents(vehicleId: string): Promise<AntiRollbackStallEventEntity[]> {
    return this.eventRepo.find({
      where: { vehicleId },
      order: { timestamp: 'DESC' },
      take: 20,
    });
  }
}

