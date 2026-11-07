import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { PantographChargingSessionEntity } from '../../database/entities/pantograph-charging-session.entity';
import {
  PantographChargingSessionRequest,
  PantographChargingSessionRecord,
  PantographAlignmentStatus,
} from '@ecoride/contracts';

@Injectable()
export class PantographChargingService {
  constructor(
    @InjectRepository(PantographChargingSessionEntity)
    private readonly sessionRepo: Repository<PantographChargingSessionEntity>,
  ) {}

  async startSession(req: PantographChargingSessionRequest): Promise<PantographChargingSessionRecord> {
    if (!req.busId || !req.stationId) {
      throw new BadRequestException('busId and stationId are required');
    }
    if (req.initialSocPct < 0 || req.initialSocPct > 100) {
      throw new BadRequestException('initialSocPct must be between 0 and 100');
    }

    const sessionNumber = `PANTO-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const tariffPaisePerKwh = 850; // ₹8.50/kWh

    const session = this.sessionRepo.create({
      sessionNumber,
      busId: req.busId,
      stationId: req.stationId,
      chargerBayNumber: req.chargerBayNumber,
      contactPressureNewtons: 120.0, // Optimal pantograph head contact pressure
      alignmentStatus: 'LOCKED_CONTACT',
      initialSocPct: req.initialSocPct,
      finalSocPct: req.initialSocPct,
      energyDeliveredKwh: 0,
      peakPowerKw: req.powerRatingKw || 350.0,
      tariffPaisePerKwh,
      totalCostPaise: 0,
    });

    const saved = await this.sessionRepo.save(session);

    return {
      id: saved.id,
      sessionNumber: saved.sessionNumber,
      busId: saved.busId,
      stationId: saved.stationId,
      chargerBayNumber: saved.chargerBayNumber,
      contactPressureNewtons: Number(saved.contactPressureNewtons),
      alignmentStatus: saved.alignmentStatus as PantographAlignmentStatus,
      initialSocPct: Number(saved.initialSocPct),
      finalSocPct: Number(saved.finalSocPct),
      energyDeliveredKwh: Number(saved.energyDeliveredKwh),
      peakPowerKw: Number(saved.peakPowerKw),
      tariffPaisePerKwh: Number(saved.tariffPaisePerKwh),
      totalCostPaise: Number(saved.totalCostPaise),
      startedAt: saved.startedAt ? saved.startedAt.toISOString() : new Date().toISOString(),
    };
  }

  async stopSession(sessionId: string, finalSocPct: number): Promise<PantographChargingSessionRecord> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Pantograph charging session ${sessionId} not found`);
    }

    const validFinalSoc = Math.min(100, Math.max(Number(session.initialSocPct), finalSocPct));
    const busBatteryCapacityKwh = 300.0;
    const socDeltaPct = validFinalSoc - Number(session.initialSocPct);
    const energyDeliveredKwh = Math.round((socDeltaPct / 100) * busBatteryCapacityKwh * 10) / 10;
    const totalCostPaise = Math.round(energyDeliveredKwh * Number(session.tariffPaisePerKwh));
    const now = new Date();

    session.finalSocPct = validFinalSoc;
    session.energyDeliveredKwh = energyDeliveredKwh;
    session.totalCostPaise = totalCostPaise;
    session.alignmentStatus = 'DISENGAGED';
    session.completedAt = now;

    const saved = await this.sessionRepo.save(session);

    return {
      id: saved.id,
      sessionNumber: saved.sessionNumber,
      busId: saved.busId,
      stationId: saved.stationId,
      chargerBayNumber: saved.chargerBayNumber,
      contactPressureNewtons: Number(saved.contactPressureNewtons),
      alignmentStatus: saved.alignmentStatus as PantographAlignmentStatus,
      initialSocPct: Number(saved.initialSocPct),
      finalSocPct: Number(saved.finalSocPct),
      energyDeliveredKwh: Number(saved.energyDeliveredKwh),
      peakPowerKw: Number(saved.peakPowerKw),
      tariffPaisePerKwh: Number(saved.tariffPaisePerKwh),
      totalCostPaise: Number(saved.totalCostPaise),
      startedAt: saved.startedAt ? saved.startedAt.toISOString() : now.toISOString(),
      completedAt: saved.completedAt ? saved.completedAt.toISOString() : now.toISOString(),
    };
  }

  async getBusSessions(busId: string): Promise<PantographChargingSessionEntity[]> {
    return this.sessionRepo.find({
      where: { busId },
      order: { startedAt: 'DESC' },
      take: 20,
    });
  }
}

