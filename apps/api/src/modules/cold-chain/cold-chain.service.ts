import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ColdChainShipmentDto,
  ColdChainTelemetryPingDto,
  TemperatureExcursionAlertDto,
  ColdChainTemperatureRange,
} from '@ecoride/contracts';
import { ColdChainShipment } from '../../database/entities/cold-chain-shipment.entity';
import { ColdChainTelemetryLog } from '../../database/entities/cold-chain-telemetry-log.entity';

@Injectable()
export class ColdChainService {
  constructor(
    @InjectRepository(ColdChainShipment)
    private readonly shipmentRepo: Repository<ColdChainShipment>,
    @InjectRepository(ColdChainTelemetryLog)
    private readonly logRepo: Repository<ColdChainTelemetryLog>,
  ) {}

  async createShipment(
    consignmentId: string,
    vehicleRegistrationNumber: string,
    cargoType: string,
    range: ColdChainTemperatureRange,
  ): Promise<ColdChainShipmentDto> {
    const minTemp = range === ColdChainTemperatureRange.ULTRA_LOW ? -20.0 : range === ColdChainTemperatureRange.CHILLED ? 2.0 : 15.0;
    const maxTemp = range === ColdChainTemperatureRange.ULTRA_LOW ? -10.0 : range === ColdChainTemperatureRange.CHILLED ? 8.0 : 25.0;
    const currentTemp = (minTemp + maxTemp) / 2.0;

    const shipment = this.shipmentRepo.create({
      consignmentId,
      vehicleRegistrationNumber,
      cargoType,
      requiredRange: range,
      minAllowedTempCelsius: minTemp,
      maxAllowedTempCelsius: maxTemp,
      currentTempCelsius: currentTemp,
      currentHumidityPercent: 65.0,
      isExcursionDetected: false,
      totalExcursionsCount: 0,
      lastTelemetryAt: new Date(),
    });

    const saved = await this.shipmentRepo.save(shipment);
    return this.mapToDto(saved);
  }

  async ingestTelemetry(dto: ColdChainTelemetryPingDto): Promise<TemperatureExcursionAlertDto | null> {
    const shipment = await this.shipmentRepo.findOne({ where: { id: dto.shipmentId } });
    if (!shipment) {
      throw new NotFoundException(`Shipment ${dto.shipmentId} not found`);
    }

    const log = this.logRepo.create({
      shipmentId: dto.shipmentId,
      reeferUnitId: dto.reeferUnitId,
      sensorTempCelsius: dto.sensorTempCelsius,
      humidityPercent: dto.humidityPercent,
      compressorActive: dto.compressorActive,
      reeferBatterySocPercent: dto.reeferBatterySocPercent,
      recordedAt: new Date(dto.recordedAt || Date.now()),
    });
    await this.logRepo.save(log);

    shipment.currentTempCelsius = dto.sensorTempCelsius;
    shipment.currentHumidityPercent = dto.humidityPercent;
    shipment.lastTelemetryAt = new Date();

    const isExcursion =
      dto.sensorTempCelsius < Number(shipment.minAllowedTempCelsius) ||
      dto.sensorTempCelsius > Number(shipment.maxAllowedTempCelsius);

    if (isExcursion) {
      shipment.isExcursionDetected = true;
      shipment.totalExcursionsCount += 1;
      await this.shipmentRepo.save(shipment);

      return {
        id: `EXCURSION-${Date.now().toString(36).toUpperCase()}`,
        shipmentId: shipment.id,
        actualTempCelsius: dto.sensorTempCelsius,
        allowedMaxTempCelsius: Number(shipment.maxAllowedTempCelsius),
        severity: dto.sensorTempCelsius > Number(shipment.maxAllowedTempCelsius) + 3.0 ? 'BREACH' : 'WARNING',
        timestamp: new Date().toISOString(),
        remedialAction: 'Increase compressor cycle and verify reefer insulation seals immediately',
      };
    } else {
      shipment.isExcursionDetected = false;
      await this.shipmentRepo.save(shipment);
      return null;
    }
  }

  private mapToDto(s: ColdChainShipment): ColdChainShipmentDto {
    return {
      id: s.id,
      consignmentId: s.consignmentId,
      vehicleRegistrationNumber: s.vehicleRegistrationNumber,
      cargoType: s.cargoType,
      requiredRange: s.requiredRange as ColdChainTemperatureRange,
      minAllowedTempCelsius: Number(s.minAllowedTempCelsius),
      maxAllowedTempCelsius: Number(s.maxAllowedTempCelsius),
      currentTempCelsius: Number(s.currentTempCelsius),
      currentHumidityPercent: Number(s.currentHumidityPercent),
      isExcursionDetected: s.isExcursionDetected,
      totalExcursionsCount: s.totalExcursionsCount,
      lastTelemetryAt: s.lastTelemetryAt.toISOString(),
    };
  }
}

