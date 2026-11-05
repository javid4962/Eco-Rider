import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatterySwapCompatibilityLog } from '../../database/entities/battery-swap-compatibility-log.entity';
import {
  Ais156TelemetryDto,
  Ais156ComplianceVerdictResult,
  Ais156SafetyVerdict,
} from '@ecoride/contracts';

@Injectable()
export class Ais156BatterySwapService {
  constructor(
    @InjectRepository(BatterySwapCompatibilityLog)
    private readonly logRepo: Repository<BatterySwapCompatibilityLog>,
  ) {}

  async evaluateCompatibility(dto: Ais156TelemetryDto): Promise<Ais156ComplianceVerdictResult> {
    const deltaCellVoltageMillivolts = Math.round(
      (dto.cellVoltageMaxVolts - dto.cellVoltageMinVolts) * 1000,
    );
    const deltaTemperatureCelsius = Number(
      (dto.maxCellTemperatureCelsius - dto.minCellTemperatureCelsius).toFixed(1),
    );

    let verdict: Ais156SafetyVerdict;
    let isEligibleForSwap = false;
    let safetyInterlockEngaged = false;
    let reason: string;

    if (dto.maxCellTemperatureCelsius > 60.0 || dto.waterIngressDetected) {
      verdict = Ais156SafetyVerdict.THERMAL_RUNAWAY_RISK;
      safetyInterlockEngaged = true;
      reason = `CRITICAL: Thermal runaway condition or water ingress detected (Temp: ${dto.maxCellTemperatureCelsius}°C, Moisture: ${dto.waterIngressDetected})`;
    } else if (deltaCellVoltageMillivolts > 50 || deltaTemperatureCelsius > 15.0) {
      verdict = Ais156SafetyVerdict.CELL_IMBALANCE_WARNING;
      safetyInterlockEngaged = true;
      reason = `SAFETY ALERT: Excessive cell imbalance (Delta V: ${deltaCellVoltageMillivolts}mV, Delta T: ${deltaTemperatureCelsius}°C)`;
    } else if (dto.insulationResistanceMegaOhms < 100.0) {
      verdict = Ais156SafetyVerdict.INSULATION_RESISTANCE_FAULT;
      safetyInterlockEngaged = true;
      reason = `ISOLATION FAULT: Insulation resistance ${dto.insulationResistanceMegaOhms}MΩ is below statutory AIS-156 minimum (100MΩ)`;
    } else {
      verdict = Ais156SafetyVerdict.SAFE_FOR_DEPLOYMENT;
      isEligibleForSwap = true;
      safetyInterlockEngaged = false;
      reason = `Battery pack compliant with AIS-156 Amendment 3 standards (${dto.vendorStandard}).`;
    }

    const log = this.logRepo.create({
      packSerialNumber: dto.packSerialNumber,
      vendorStandard: dto.vendorStandard,
      vehicleId: null,
      maxCellTempCelsius: dto.maxCellTemperatureCelsius,
      minCellTempCelsius: dto.minCellTemperatureCelsius,
      cellVoltageMaxVolts: dto.cellVoltageMaxVolts,
      cellVoltageMinVolts: dto.cellVoltageMinVolts,
      insulationResistanceMegaOhms: dto.insulationResistanceMegaOhms,
      socPercent: dto.socPercent,
      sohPercent: dto.sohPercent,
      verdict,
      isEligibleForSwap,
      safetyInterlockEngaged,
      reason,
    });

    await this.logRepo.save(log);

    return {
      packSerialNumber: dto.packSerialNumber,
      vendorStandard: dto.vendorStandard,
      verdict,
      isEligibleForSwap,
      deltaCellVoltageMillivolts,
      deltaTemperatureCelsius,
      safetyInterlockEngaged,
      reason,
    };
  }

  async getRecentLogs(packSerialNumber: string): Promise<BatterySwapCompatibilityLog[]> {
    return await this.logRepo.find({
      where: { packSerialNumber },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
}
