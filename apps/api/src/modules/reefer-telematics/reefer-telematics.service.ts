import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReeferTelematicsLog } from '../../database/entities/reefer-telematics-log.entity';
import {
  ReeferCargoCategory,
  ReeferCoolingStatus,
  ReeferTelemetryDto,
  ReeferAdjustmentResult,
} from '@ecoride/contracts';

@Injectable()
export class ReeferTelematicsService {
  constructor(
    @InjectRepository(ReeferTelematicsLog)
    private readonly reeferRepo: Repository<ReeferTelematicsLog>,
  ) {}

  async processReeferTelemetry(dto: ReeferTelemetryDto): Promise<ReeferAdjustmentResult> {
    if (dto.batterySocPercent < 15) {
      throw new BadRequestException('Reefer van battery critically low (< 15% SoC). Cannot maintain cold chain cooling.');
    }

    const tempDelta = dto.currentInternalTempCelsius - dto.targetTempCelsius;
    const absDelta = Math.abs(tempDelta);

    let status: ReeferCoolingStatus;
    let commandedSetpointCelsius = dto.targetTempCelsius;
    let commandedCompressorRpm = 2500;
    let requiresImmediateIntervention = false;

    if (absDelta <= 0.5) {
      status = ReeferCoolingStatus.OPTIMAL;
      commandedSetpointCelsius = dto.targetTempCelsius;
      commandedCompressorRpm = 2500;
      requiresImmediateIntervention = false;
    } else if (absDelta <= 2.0) {
      status = ReeferCoolingStatus.EXCURSION_RISK;
      if (tempDelta > 0) {
        // Too warm
        commandedSetpointCelsius = dto.targetTempCelsius - 1.0;
        commandedCompressorRpm = 3500;
      } else {
        // Too cold
        commandedSetpointCelsius = dto.targetTempCelsius + 1.0;
        commandedCompressorRpm = 1800;
      }
      requiresImmediateIntervention = false;
    } else {
      status = ReeferCoolingStatus.CRITICAL_BREACH;
      commandedSetpointCelsius = tempDelta > 0 ? dto.targetTempCelsius - 2.5 : dto.targetTempCelsius + 2.0;
      commandedCompressorRpm = 4000;
      requiresImmediateIntervention = true;
    }

    // Safety clamps by category
    if (dto.cargoCategory === ReeferCargoCategory.PHARMACEUTICAL_VACCINE) {
      commandedSetpointCelsius = Math.max(2.0, Math.min(8.0, commandedSetpointCelsius));
    } else if (dto.cargoCategory === ReeferCargoCategory.FROZEN_PERISHABLE) {
      commandedSetpointCelsius = Math.max(-25.0, Math.min(-15.0, commandedSetpointCelsius));
    }

    const log = this.reeferRepo.create({
      vehicleId: dto.vehicleId,
      consignmentId: dto.consignmentId,
      cargoCategory: dto.cargoCategory,
      targetTempCelsius: dto.targetTempCelsius,
      currentInternalTempCelsius: dto.currentInternalTempCelsius,
      ambientTempCelsius: dto.ambientTempCelsius,
      compressorRpm: commandedCompressorRpm,
      batterySocPercent: dto.batterySocPercent,
      status,
      commandedSetpointCelsius,
    });

    const saved = await this.reeferRepo.save(log);

    return {
      vehicleId: saved.vehicleId,
      consignmentId: saved.consignmentId,
      cargoCategory: saved.cargoCategory,
      status: saved.status,
      commandedSetpointCelsius: Number(saved.commandedSetpointCelsius),
      commandedCompressorRpm: saved.compressorRpm,
      requiresImmediateIntervention,
      telemetryTimestamp: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
