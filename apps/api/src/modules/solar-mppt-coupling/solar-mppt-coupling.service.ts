import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolarMpptCouplingSessionEntity } from '../../database/entities/solar-mppt-coupling-session.entity';
import {
  LogMpptCouplingTelemetryDto,
  MpptCouplingMode,
} from '@ecoride/contracts';

@Injectable()
export class SolarMpptCouplingService {
  constructor(
    @InjectRepository(SolarMpptCouplingSessionEntity)
    private readonly sessionRepo: Repository<SolarMpptCouplingSessionEntity>,
  ) {}

  async logMpptCouplingTelemetry(dto: LogMpptCouplingTelemetryDto): Promise<SolarMpptCouplingSessionEntity> {
    const solarPowerKw = Math.round(((dto.mpptDcBusVoltageVolts * dto.solarDcCurrentAmps) / 1000.0) * 100) / 100;
    let couplingMode = MpptCouplingMode.DIRECT_SOLAR_DC;
    let gridPowerImportKw = 0.0;

    if (solarPowerKw >= dto.vehicleDemandKw) {
      couplingMode = MpptCouplingMode.DIRECT_SOLAR_DC;
      gridPowerImportKw = 0.0;
    } else {
      couplingMode = MpptCouplingMode.GRID_SUPPLEMENTED;
      gridPowerImportKw = Math.round((dto.vehicleDemandKw - solarPowerKw) * 100) / 100;
    }

    const avoidedAcDcLossKwh = Math.round(dto.vehicleDemandKw * 0.10 * 0.25 * 100) / 100; // 10% avoided on 15m duration
    const totalSolarEnergyDeliveredKwh = Math.round(Math.min(solarPowerKw, dto.vehicleDemandKw) * 0.25 * 100) / 100;

    const session = this.sessionRepo.create({
      depotId: dto.depotId,
      pvArrayId: dto.pvArrayId,
      chargerGunId: dto.chargerGunId,
      vehicleId: dto.vehicleId,
      solarIrradianceWPerM2: dto.solarIrradianceWPerM2,
      mpptDcBusVoltageVolts: dto.mpptDcBusVoltageVolts,
      solarDcCurrentAmps: dto.solarDcCurrentAmps,
      solarPowerKw,
      vehicleDemandKw: dto.vehicleDemandKw,
      gridPowerImportKw,
      dcConversionEfficiencyPercent: 98.5,
      avoidedAcDcLossKwh,
      couplingMode,
      sessionStartedAt: new Date(),
      totalSolarEnergyDeliveredKwh,
    });

    return this.sessionRepo.save(session);
  }

  async getSession(id: string): Promise<SolarMpptCouplingSessionEntity> {
    const record = await this.sessionRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Solar MPPT coupling session ${id} not found`);
    }
    return record;
  }
}

