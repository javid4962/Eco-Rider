import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BmsWarrantyTelemetryLogEntity } from '../../database/entities/bms-warranty-telemetry-log.entity';
import {
  BmsWarrantyReading,
  BmsWarrantyProtectionRecord,
  WarrantyProtectionAction,
} from '@ecoride/contracts';

@Injectable()
export class BmsWarrantyTelemetryService {
  constructor(
    @InjectRepository(BmsWarrantyTelemetryLogEntity)
    private readonly logRepo: Repository<BmsWarrantyTelemetryLogEntity>,
  ) {}

  async evaluateThermalReading(reading: BmsWarrantyReading): Promise<BmsWarrantyProtectionRecord> {
    if (!reading.vehicleId || !reading.batterySerial) {
      throw new BadRequestException('vehicleId and batterySerial are required');
    }

    let actionTaken: WarrantyProtectionAction = 'ALLOW_FAST_CHARGE';
    let allowedPowerKw = reading.requestedFastChargeKw;
    let depotCoolingBayAssigned: string | undefined = undefined;
    let warrantyProtectionActive = false;

    if (reading.maxCellTemperatureCelsius > 48) {
      actionTaken = 'BLOCK_AND_ROUTE_COOLING';
      allowedPowerKw = 0;
      depotCoolingBayAssigned = 'DEPOT-COOLING-BAY-BZA-01';
      warrantyProtectionActive = true;
    } else if (reading.maxCellTemperatureCelsius >= 45) {
      actionTaken = 'DERATE_POWER';
      allowedPowerKw = Math.round(reading.requestedFastChargeKw * 0.5 * 10) / 10;
      warrantyProtectionActive = true;
    }

    const log = this.logRepo.create({
      vehicleId: reading.vehicleId,
      batterySerial: reading.batterySerial,
      maxCellTemperatureCelsius: reading.maxCellTemperatureCelsius,
      actionTaken,
      allowedPowerKw,
      depotCoolingBayAssigned: depotCoolingBayAssigned ?? null,
      warrantyProtectionActive,
    });

    const saved = await this.logRepo.save(log);

    return {
      id: saved.id,
      vehicleId: saved.vehicleId,
      batterySerial: saved.batterySerial,
      maxCellTemperatureCelsius: Number(saved.maxCellTemperatureCelsius),
      actionTaken: saved.actionTaken as WarrantyProtectionAction,
      allowedPowerKw: Number(saved.allowedPowerKw),
      depotCoolingBayAssigned: saved.depotCoolingBayAssigned ?? undefined,
      warrantyProtectionActive: saved.warrantyProtectionActive,
      timestamp: saved.timestamp ? saved.timestamp.toISOString() : new Date().toISOString(),
    };
  }

  async getVehicleWarrantyLogs(vehicleId: string): Promise<BmsWarrantyTelemetryLogEntity[]> {
    return this.logRepo.find({
      where: { vehicleId },
      order: { timestamp: 'DESC' },
      take: 20,
    });
  }
}

