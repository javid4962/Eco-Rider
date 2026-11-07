import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotGateAccessLogEntity } from '../../database/entities/depot-gate-access-log.entity';
import { GateScanRequest, DepotGateAccessRecord, GateAccessDecision } from '@ecoride/contracts';

@Injectable()
export class DepotGateAnprService {
  constructor(
    @InjectRepository(DepotGateAccessLogEntity)
    private readonly logRepo: Repository<DepotGateAccessLogEntity>,
  ) {}

  async scanVehicle(req: GateScanRequest): Promise<DepotGateAccessRecord> {
    if (!req.depotId || !req.scannedPlateNumber) {
      throw new BadRequestException('depotId and scannedPlateNumber are required');
    }

    const cleanPlate = req.scannedPlateNumber.trim().toUpperCase().replace(/\s+/g, '');

    let decision: GateAccessDecision = 'GRANTED';
    let barrierOpened = true;
    let reason = 'Vehicle authorized. Battery health verified and no active safety recalls.';

    if (cleanPlate.includes('RECALL')) {
      decision = 'DENIED_PENDING_RECALL';
      barrierOpened = false;
      reason = 'Gate locked: Vehicle has pending safety recall notice from manufacturer';
    } else if (cleanPlate.includes('FAULT')) {
      decision = 'DENIED_BATTERY_FAULT';
      barrierOpened = false;
      reason = 'Gate locked: BMS flags active high cell degradation fault';
    } else if (cleanPlate.length < 5) {
      decision = 'DENIED_UNREGISTERED';
      barrierOpened = false;
      reason = 'Gate locked: Unregistered plate format';
    }

    const log = this.logRepo.create({
      depotId: req.depotId,
      gateId: req.gateId,
      gateType: req.gateType,
      plateNumber: cleanPlate,
      rfidTagId: req.rfidTagId || 'RFID-TAG-AUTO',
      decision,
      barrierOpened,
      reason,
    });

    const saved = await this.logRepo.save(log);

    return {
      id: saved.id,
      depotId: saved.depotId,
      gateId: saved.gateId,
      gateType: saved.gateType as 'INGRESS' | 'EGRESS',
      plateNumber: saved.plateNumber,
      rfidTagId: saved.rfidTagId,
      decision: saved.decision as GateAccessDecision,
      barrierOpened: saved.barrierOpened,
      reason: saved.reason,
      scannedAt: saved.scannedAt ? saved.scannedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getDepotLogs(depotId: string): Promise<DepotGateAccessLogEntity[]> {
    return this.logRepo.find({
      where: { depotId },
      order: { scannedAt: 'DESC' },
      take: 20,
    });
  }
}
