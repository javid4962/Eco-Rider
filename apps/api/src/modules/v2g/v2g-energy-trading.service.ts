import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  V2gDischargeSessionDto,
  InitiateV2gDischargeDto,
  V2gDischargeStatus,
} from '@ecoride/contracts';
import { V2gDischargeSession } from '../../database/entities/v2g-discharge-session.entity';

@Injectable()
export class V2gEnergyTradingService {
  constructor(
    @InjectRepository(V2gDischargeSession)
    private readonly v2gRepo: Repository<V2gDischargeSession>,
  ) {}

  async initiateDischarge(dto: InitiateV2gDischargeDto): Promise<V2gDischargeSessionDto> {
    if (dto.currentSocPercent <= dto.minSocThresholdPercent) {
      throw new BadRequestException(
        `Vehicle SoC (${dto.currentSocPercent}%) must exceed minimum reserve threshold (${dto.minSocThresholdPercent}%) to initiate V2G feed-in`,
      );
    }

    if (dto.targetExportKwh <= 0) {
      throw new BadRequestException('Target export kWh must be greater than zero');
    }

    const sessionId = `V2G-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalRevenueEarnedPaise = Math.round(dto.targetExportKwh * dto.feedInTariffPaisePerKwh);

    const session = this.v2gRepo.create({
      sessionId,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      depotId: dto.depotId,
      chargerGunId: dto.chargerGunId,
      initialSocPercent: dto.currentSocPercent,
      currentSocPercent: dto.currentSocPercent,
      minSocThresholdPercent: dto.minSocThresholdPercent,
      energyExportedKwh: dto.targetExportKwh,
      feedInTariffPaisePerKwh: dto.feedInTariffPaisePerKwh,
      totalRevenueEarnedPaise,
      status: V2gDischargeStatus.DISCHARGING,
    });

    const saved = await this.v2gRepo.save(session);
    return this.mapToDto(saved);
  }

  async completeDischarge(sessionId: string, actualExportedKwh: number): Promise<V2gDischargeSessionDto> {
    const session = await this.v2gRepo.findOne({ where: { sessionId } });
    if (!session) {
      throw new NotFoundException(`V2G discharge session ${sessionId} not found`);
    }

    session.energyExportedKwh = actualExportedKwh;
    session.totalRevenueEarnedPaise = Math.round(actualExportedKwh * session.feedInTariffPaisePerKwh);
    session.status = V2gDischargeStatus.COMPLETED;
    session.completedAt = new Date();

    const saved = await this.v2gRepo.save(session);
    return this.mapToDto(saved);
  }

  private mapToDto(s: V2gDischargeSession): V2gDischargeSessionDto {
    return {
      sessionId: s.sessionId,
      vehicleRegistrationNumber: s.vehicleRegistrationNumber,
      depotId: s.depotId,
      chargerGunId: s.chargerGunId,
      initialSocPercent: s.initialSocPercent,
      currentSocPercent: s.currentSocPercent,
      minSocThresholdPercent: s.minSocThresholdPercent,
      energyExportedKwh: Number(s.energyExportedKwh),
      feedInTariffPaisePerKwh: s.feedInTariffPaisePerKwh,
      totalRevenueEarnedPaise: s.totalRevenueEarnedPaise,
      status: s.status as V2gDischargeStatus,
      startedAt: s.startedAt ? s.startedAt.toISOString() : new Date().toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : undefined,
    };
  }
}
