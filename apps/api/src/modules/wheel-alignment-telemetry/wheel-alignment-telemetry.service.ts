import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WheelAlignmentLogEntity } from '../../database/entities/wheel-alignment-log.entity';
import {
  AlignmentStatus,
  IngestWheelAlignmentDto,
} from '@ecoride/contracts';

@Injectable()
export class WheelAlignmentTelemetryService {
  constructor(
    @InjectRepository(WheelAlignmentLogEntity)
    private readonly alignmentRepo: Repository<WheelAlignmentLogEntity>,
  ) {}

  async ingestWheelAlignment(dto: IngestWheelAlignmentDto): Promise<WheelAlignmentLogEntity> {
    const absOffset = Math.abs(dto.steeringAngleMeanOffsetDeg);
    let alignmentStatus = AlignmentStatus.PERFECT;
    let tireScrubSeverityIndex = 0.5;
    let estimatedTireLifeReductionPercent = 0.0;
    let depotMaintenanceRequired = false;
    let maintenanceWorkOrderRef: string | undefined = undefined;

    if (absOffset >= 5.0 || dto.lateralDriftRateMps2 >= 1.2) {
      alignmentStatus = AlignmentStatus.CRITICAL_TIRE_SCRUB;
      tireScrubSeverityIndex = 8.5;
      estimatedTireLifeReductionPercent = 40.0;
      depotMaintenanceRequired = true;
      maintenanceWorkOrderRef = `WO-ALIGN-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (absOffset >= 3.0 || dto.lateralDriftRateMps2 >= 0.7) {
      alignmentStatus = AlignmentStatus.MODERATE_MISALIGNMENT;
      tireScrubSeverityIndex = 5.0;
      estimatedTireLifeReductionPercent = 20.0;
      depotMaintenanceRequired = true;
      maintenanceWorkOrderRef = `WO-ALIGN-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (absOffset >= 1.5) {
      alignmentStatus = AlignmentStatus.MINOR_DRIFT;
      tireScrubSeverityIndex = 2.5;
      estimatedTireLifeReductionPercent = 8.0;
      depotMaintenanceRequired = false;
    }

    const log = this.alignmentRepo.create({
      vehicleId: dto.vehicleId,
      captainId: dto.captainId,
      rollingWindowKm: dto.rollingWindowKm,
      steeringAngleMeanOffsetDeg: dto.steeringAngleMeanOffsetDeg,
      lateralDriftRateMps2: dto.lateralDriftRateMps2,
      yawRateVariance: dto.yawRateVariance,
      tireScrubSeverityIndex,
      estimatedTireLifeReductionPercent,
      alignmentStatus,
      depotMaintenanceRequired,
      maintenanceWorkOrderRef,
    });

    return this.alignmentRepo.save(log);
  }

  async getLog(id: string): Promise<WheelAlignmentLogEntity> {
    const record = await this.alignmentRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Wheel alignment log ${id} not found`);
    }
    return record;
  }
}
