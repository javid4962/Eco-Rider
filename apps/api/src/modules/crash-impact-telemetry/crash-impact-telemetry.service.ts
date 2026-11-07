import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrashImpactTelemetryEventEntity } from '../../database/entities/crash-impact-telemetry-event.entity';
import {
  CrashSeverity,
  HighVoltageContactorStatus,
  IngestCrashImpactDto,
} from '@ecoride/contracts';

@Injectable()
export class CrashImpactTelemetryService {
  constructor(
    @InjectRepository(CrashImpactTelemetryEventEntity)
    private readonly crashRepo: Repository<CrashImpactTelemetryEventEntity>,
  ) {}

  async ingestCrashImpact(dto: IngestCrashImpactDto): Promise<CrashImpactTelemetryEventEntity> {
    let severity = CrashSeverity.LOW;
    if (dto.decelerationGForce >= 25.0 || (dto.airbagDeployed && dto.packVoltageVolts > 60.0)) {
      severity = CrashSeverity.CATASTROPHIC;
    } else if (dto.decelerationGForce >= 15.0) {
      severity = CrashSeverity.SEVERE;
    } else if (dto.decelerationGForce >= 8.0) {
      severity = CrashSeverity.MODERATE;
    }

    let hvContactorStatus = HighVoltageContactorStatus.ISOLATED_SAFE;
    let emergency112Notified = false;
    let emergencyDispatchRef: string | undefined = undefined;

    if (dto.pyroFuseBlown || dto.decelerationGForce >= 15.0) {
      hvContactorStatus = HighVoltageContactorStatus.PYRO_FUSED;
      emergency112Notified = true;
      emergencyDispatchRef = `DISPATCH-112-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (dto.isolationResistanceKOhms < 100.0) {
      hvContactorStatus = HighVoltageContactorStatus.ISOLATION_FAILED;
      emergency112Notified = true;
      emergencyDispatchRef = `DISPATCH-112-ISO-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const event = this.crashRepo.create({
      vehicleId: dto.vehicleId,
      tripId: dto.tripId,
      decelerationGForce: dto.decelerationGForce,
      airbagDeployed: dto.airbagDeployed,
      pyroFuseBlown: dto.pyroFuseBlown,
      hvContactorStatus,
      packVoltageVolts: dto.packVoltageVolts,
      isolationResistanceKOhms: dto.isolationResistanceKOhms,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speedKmhAtImpact: dto.speedKmhAtImpact,
      passengerCount: dto.passengerCount,
      severity,
      emergency112Notified,
      emergencyDispatchRef,
    });

    return this.crashRepo.save(event);
  }

  async getCrashEvent(id: string): Promise<CrashImpactTelemetryEventEntity> {
    const event = await this.crashRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Crash impact event ${id} not found`);
    }
    return event;
  }
}

