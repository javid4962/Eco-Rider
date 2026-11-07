import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { V2hResidentialSession } from '../../database/entities/v2h-residential-session.entity';
import {
  V2hDischargeStatus,
  InitiateV2hDischargeDto,
  V2hDischargeTelemetryDto,
  V2hSessionResult,
} from '@ecoride/contracts';

@Injectable()
export class V2hResidentialBackupService {
  constructor(
    @InjectRepository(V2hResidentialSession)
    private readonly sessionRepo: Repository<V2hResidentialSession>,
  ) {}

  async initiateV2hSession(dto: InitiateV2hDischargeDto): Promise<V2hSessionResult> {
    if (dto.contractedKwh < 1 || dto.contractedKwh > 8) {
      throw new BadRequestException('Contracted V2H energy must be between 1.0 kWh and 8.0 kWh');
    }

    const session = this.sessionRepo.create({
      householdAccountId: dto.householdAccountId,
      vehicleId: dto.vehicleId,
      contractedKwh: dto.contractedKwh,
      energyDeliveredKwh: 0,
      dischargeTariffPaisePerKwh: 1400, // ₹14.00/kWh
      totalEarningsPaise: 0,
      status: V2hDischargeStatus.DISCHARGING,
    });

    const saved = await this.sessionRepo.save(session);

    return {
      sessionId: saved.id,
      householdAccountId: saved.householdAccountId,
      vehicleId: saved.vehicleId,
      energyDeliveredKwh: 0,
      dischargeTariffPaisePerKwh: Number(saved.dischargeTariffPaisePerKwh),
      totalEarningsPaise: 0,
      status: saved.status,
      startedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
      endedAt: null,
    };
  }

  async updateTelemetry(dto: V2hDischargeTelemetryDto): Promise<V2hSessionResult> {
    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session) {
      throw new NotFoundException('V2H session not found');
    }

    session.energyDeliveredKwh = dto.energyDeliveredKwh;
    session.totalEarningsPaise = Math.round(dto.energyDeliveredKwh * Number(session.dischargeTariffPaisePerKwh));

    if (dto.batteryRemainingSoc < 20) {
      // Emergency reserve trip protection: preserve vehicle range
      session.status = V2hDischargeStatus.EMERGENCY_RESERVE_TRIP;
      session.endedAt = new Date();
    } else if (dto.energyDeliveredKwh >= Number(session.contractedKwh)) {
      session.status = V2hDischargeStatus.TARGET_REACHED;
      session.endedAt = new Date();
    } else {
      session.status = V2hDischargeStatus.DISCHARGING;
    }

    const saved = await this.sessionRepo.save(session);

    return {
      sessionId: saved.id,
      householdAccountId: saved.householdAccountId,
      vehicleId: saved.vehicleId,
      energyDeliveredKwh: Number(saved.energyDeliveredKwh),
      dischargeTariffPaisePerKwh: Number(saved.dischargeTariffPaisePerKwh),
      totalEarningsPaise: Number(saved.totalEarningsPaise),
      status: saved.status,
      startedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
      endedAt: saved.endedAt ? saved.endedAt.toISOString() : null,
    };
  }
}
