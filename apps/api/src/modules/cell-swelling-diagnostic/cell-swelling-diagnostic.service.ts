import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CellDiagnosticGateLogEntity } from '../../database/entities/cell-diagnostic-gate-log.entity';
import {
  CellDiagnosticHealth,
  PerformCellDiagnosticDto,
} from '@ecoride/contracts';

@Injectable()
export class CellSwellingDiagnosticService {
  constructor(
    @InjectRepository(CellDiagnosticGateLogEntity)
    private readonly diagRepo: Repository<CellDiagnosticGateLogEntity>,
  ) {}

  async performDiagnostic(dto: PerformCellDiagnosticDto): Promise<CellDiagnosticGateLogEntity> {
    let diagnosticHealth = CellDiagnosticHealth.NORMAL;
    let chargingAllowed = true;
    let quarantineTriggered = false;
    let fireSuppressionPreArmed = false;

    if (dto.measuredSwellingMm > 4.5 || dto.cellSurfaceTemperatureC >= 55.0) {
      diagnosticHealth = CellDiagnosticHealth.THERMAL_RUNAWAY_RISK;
      chargingAllowed = false;
      quarantineTriggered = true;
      fireSuppressionPreArmed = true;
    } else if (dto.measuredSwellingMm > 3.5) {
      diagnosticHealth = CellDiagnosticHealth.CRITICAL_SWELLING;
      chargingAllowed = false;
      quarantineTriggered = true;
      fireSuppressionPreArmed = false;
    } else if (dto.internalGasPressureKPa > 150.0) {
      diagnosticHealth = CellDiagnosticHealth.ELEVATED_PRESSURE;
      chargingAllowed = true;
      quarantineTriggered = false;
      fireSuppressionPreArmed = false;
    }

    const log = this.diagRepo.create({
      depotId: dto.depotId,
      bayNumber: dto.bayNumber,
      batteryPackSerial: dto.batteryPackSerial,
      vehicleId: dto.vehicleId,
      measuredSwellingMm: dto.measuredSwellingMm,
      maxAllowableSwellingMm: 3.5,
      internalGasPressureKPa: dto.internalGasPressureKPa,
      cellSurfaceTemperatureC: dto.cellSurfaceTemperatureC,
      diagnosticHealth,
      chargingAllowed,
      quarantineTriggered,
      fireSuppressionPreArmed,
    });

    return this.diagRepo.save(log);
  }

  async getDiagnosticLog(id: string): Promise<CellDiagnosticGateLogEntity> {
    const record = await this.diagRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Cell diagnostic log ${id} not found`);
    }
    return record;
  }
}
