import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { OcpiRoamingSessionEntity } from '../../database/entities/ocpi-roaming-session.entity';
import {
  OcpiSessionStartRequest,
  OcpiRoamingSessionRecord,
  OcpiSessionStatus,
} from '@ecoride/contracts';

@Injectable()
export class OcpiRoamingProtocolService {
  constructor(
    @InjectRepository(OcpiRoamingSessionEntity)
    private readonly sessionRepo: Repository<OcpiRoamingSessionEntity>,
  ) {}

  async startRoamingSession(req: OcpiSessionStartRequest): Promise<OcpiRoamingSessionRecord> {
    if (!req.partnerCpoId || !req.ecorideVehicleVin) {
      throw new BadRequestException('partnerCpoId and ecorideVehicleVin are required');
    }

    const ocpiSessionId = `OCPI-AP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const roamingTariffPaisePerKwh = 1250; // ₹12.50/kWh standard inter-CPO roaming rate

    const session = this.sessionRepo.create({
      ocpiSessionId,
      partnerCpoId: req.partnerCpoId,
      partnerStationId: req.partnerStationId,
      ecorideVehicleVin: req.ecorideVehicleVin,
      totalKwh: 0,
      roamingTariffPaisePerKwh,
      totalCostPaise: 0,
      clearinghouseSettlementId: 'PENDING',
      status: 'ACTIVE',
    });

    const saved = await this.sessionRepo.save(session);

    return {
      id: saved.id,
      ocpiSessionId: saved.ocpiSessionId,
      partnerCpoId: saved.partnerCpoId,
      partnerStationId: saved.partnerStationId,
      ecorideVehicleVin: saved.ecorideVehicleVin,
      totalKwh: Number(saved.totalKwh),
      roamingTariffPaisePerKwh: Number(saved.roamingTariffPaisePerKwh),
      totalCostPaise: Number(saved.totalCostPaise),
      clearinghouseSettlementId: saved.clearinghouseSettlementId,
      status: saved.status as OcpiSessionStatus,
      startedAt: saved.startedAt ? saved.startedAt.toISOString() : new Date().toISOString(),
    };
  }

  async stopRoamingSession(sessionId: string, totalKwh: number): Promise<OcpiRoamingSessionRecord> {
    const session = await this.sessionRepo.findOne({ where: { ocpiSessionId: sessionId } });
    if (!session) {
      throw new NotFoundException(`OCPI session ${sessionId} not found`);
    }

    const validKwh = Math.max(0, totalKwh);
    const totalCostPaise = Math.round(validKwh * Number(session.roamingTariffPaisePerKwh));
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const clearinghouseSettlementId = `AP-OCPI-SETTLE-${todayStr}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const now = new Date();

    session.totalKwh = validKwh;
    session.totalCostPaise = totalCostPaise;
    session.clearinghouseSettlementId = clearinghouseSettlementId;
    session.status = 'COMPLETED';
    session.completedAt = now;

    const saved = await this.sessionRepo.save(session);

    return {
      id: saved.id,
      ocpiSessionId: saved.ocpiSessionId,
      partnerCpoId: saved.partnerCpoId,
      partnerStationId: saved.partnerStationId,
      ecorideVehicleVin: saved.ecorideVehicleVin,
      totalKwh: Number(saved.totalKwh),
      roamingTariffPaisePerKwh: Number(saved.roamingTariffPaisePerKwh),
      totalCostPaise: Number(saved.totalCostPaise),
      clearinghouseSettlementId: saved.clearinghouseSettlementId,
      status: saved.status as OcpiSessionStatus,
      startedAt: saved.startedAt ? saved.startedAt.toISOString() : now.toISOString(),
      completedAt: saved.completedAt ? saved.completedAt.toISOString() : now.toISOString(),
    };
  }

  async getSession(sessionId: string): Promise<OcpiRoamingSessionRecord> {
    const session = await this.sessionRepo.findOne({ where: { ocpiSessionId: sessionId } });
    if (!session) {
      throw new NotFoundException(`OCPI session ${sessionId} not found`);
    }

    return {
      id: session.id,
      ocpiSessionId: session.ocpiSessionId,
      partnerCpoId: session.partnerCpoId,
      partnerStationId: session.partnerStationId,
      ecorideVehicleVin: session.ecorideVehicleVin,
      totalKwh: Number(session.totalKwh),
      roamingTariffPaisePerKwh: Number(session.roamingTariffPaisePerKwh),
      totalCostPaise: Number(session.totalCostPaise),
      clearinghouseSettlementId: session.clearinghouseSettlementId,
      status: session.status as OcpiSessionStatus,
      startedAt: session.startedAt ? session.startedAt.toISOString() : new Date().toISOString(),
      completedAt: session.completedAt ? session.completedAt.toISOString() : undefined,
    };
  }
}

