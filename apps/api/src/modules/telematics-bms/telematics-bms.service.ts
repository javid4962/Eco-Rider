import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BmsTelemetryPingDto,
  BmsAnomalyAlertDto,
  BmsThermalSafetyLevel,
} from '@ecoride/contracts';
import { VehicleBmsTelemetry } from '../../database/entities/vehicle-bms-telemetry.entity';
import { BmsAlertIncident } from '../../database/entities/bms-alert-incident.entity';

@Injectable()
export class TelematicsBmsService {
  constructor(
    @InjectRepository(VehicleBmsTelemetry)
    private readonly bmsRepo: Repository<VehicleBmsTelemetry>,
    @InjectRepository(BmsAlertIncident)
    private readonly alertRepo: Repository<BmsAlertIncident>,
  ) {}

  /**
   * Ingests real-time BMS IoT telemetry ping from OBD-II / CAN bus dongle
   */
  async ingestPing(dto: BmsTelemetryPingDto): Promise<{ success: boolean; safetyLevel: BmsThermalSafetyLevel; alertTriggered: boolean }> {
    if (dto.packVoltageVolts <= 0) {
      throw new BadRequestException('Invalid pack voltage received from BMS gateway.');
    }

    // Determine safety level
    let safetyLevel = BmsThermalSafetyLevel.NORMAL;
    let alertTriggered = false;
    let autoLockout = false;
    let issue = '';

    if (dto.maxCellTempCelsius > 65.0 || dto.cellVoltageDeltaMv > 300) {
      safetyLevel = BmsThermalSafetyLevel.THERMAL_RUNAWAY_RISK;
      alertTriggered = true;
      autoLockout = true;
      issue = `EMERGENCY: Thermal Runaway Risk detected! Max cell temp ${dto.maxCellTempCelsius}°C, delta ${dto.cellVoltageDeltaMv}mV.`;
    } else if (dto.maxCellTempCelsius > 55.0 || dto.cellVoltageDeltaMv > 150) {
      safetyLevel = BmsThermalSafetyLevel.CRITICAL_OVERHEAT;
      alertTriggered = true;
      autoLockout = true;
      issue = `CRITICAL: Overheating detected! Cell temperature ${dto.maxCellTempCelsius}°C exceeded AP thermal safety limit (55°C).`;
    } else if (dto.maxCellTempCelsius > 45.0) {
      safetyLevel = BmsThermalSafetyLevel.ELEVATED;
    }

    const telemetry = this.bmsRepo.create({
      vehicleId: dto.vehicleId,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      packVoltageVolts: dto.packVoltageVolts,
      packCurrentAmperes: dto.packCurrentAmperes,
      cellVoltageDeltaMv: dto.cellVoltageDeltaMv,
      maxCellTempCelsius: dto.maxCellTempCelsius,
      minCellTempCelsius: dto.minCellTempCelsius,
      inverterTempCelsius: dto.inverterTempCelsius,
      motorRpm: dto.motorRpm,
      energyConsumptionWhPerKm: dto.energyConsumptionWhPerKm,
      stateOfChargePercent: dto.stateOfChargePercent,
      stateOfHealthPercent: dto.stateOfHealthPercent,
      bmsThermalSafetyLevel: safetyLevel,
      faultCodes: dto.faultCodes || [],
    });

    await this.bmsRepo.save(telemetry);

    if (alertTriggered) {
      const alert = this.alertRepo.create({
        vehicleId: dto.vehicleId,
        vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
        severity: safetyLevel === BmsThermalSafetyLevel.THERMAL_RUNAWAY_RISK ? 'EMERGENCY' : 'CRITICAL',
        issue,
        diagnosticData: {
          maxCellTemp: dto.maxCellTempCelsius,
          voltageDeltaMv: dto.cellVoltageDeltaMv,
          inverterTemp: dto.inverterTempCelsius,
        },
        autoLockoutApplied: autoLockout,
      });
      await this.alertRepo.save(alert);
    }

    return {
      success: true,
      safetyLevel,
      alertTriggered,
    };
  }

  /**
   * Retrieves latest BMS safety alert incidents for an EV vehicle
   */
  async getVehicleAlerts(vehicleId: string): Promise<BmsAnomalyAlertDto[]> {
    const alerts = await this.alertRepo.find({
      where: { vehicleId },
      order: { alertTimestamp: 'DESC' },
      take: 10,
    });

    return alerts.map((a) => ({
      id: a.id,
      vehicleId: a.vehicleId,
      vehicleRegistrationNumber: a.vehicleRegistrationNumber,
      severity: a.severity as 'WARNING' | 'CRITICAL' | 'EMERGENCY',
      issue: a.issue,
      diagnosticData: a.diagnosticData,
      autoLockoutApplied: a.autoLockoutApplied,
      alertTimestamp: a.alertTimestamp.toISOString(),
    }));
  }

  /**
   * Retrieves latest BMS snapshot for an EV vehicle
   */
  async getLatestBmsSnapshot(vehicleId: string): Promise<VehicleBmsTelemetry | null> {
    return this.bmsRepo.findOne({
      where: { vehicleId },
      order: { recordedAt: 'DESC' },
    });
  }
}

