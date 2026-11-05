import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OcppChargingProfileDto,
  TransformerLoadStatusDto,
  SetSmartChargingProfileDto,
  ChargingProfilePurposeType,
  ChargingRateUnitType,
} from '@ecoride/contracts';
import { SmartChargingProfile } from '../../database/entities/smart-charging-profile.entity';
import { TransformerStationLoad } from '../../database/entities/transformer-station-load.entity';

@Injectable()
export class SmartChargingService {
  constructor(
    @InjectRepository(SmartChargingProfile)
    private readonly profileRepo: Repository<SmartChargingProfile>,
    @InjectRepository(TransformerStationLoad)
    private readonly transformerRepo: Repository<TransformerStationLoad>,
  ) {}

  /**
   * Evaluates transformer load and applies dynamic OCPP 2.0.1 smart charging throttling
   */
  async evaluateTransformerLoad(stationId: string, currentActiveVehicles: number): Promise<TransformerLoadStatusDto> {
    let transformer = await this.transformerRepo.findOne({ where: { stationId } });
    if (!transformer) {
      transformer = this.transformerRepo.create({
        stationId,
        stationName: 'Vijayawada Central EV Depot Hub',
        gridSubstationName: 'APCPDCL Auto Nagar 33/11kV Substation',
        transformerCapacityKva: 500,
        currentLoadKw: 0,
        loadPercentage: 0,
        isThrottlingActive: false,
        activeChargingVehiclesCount: 0,
        recommendedMaxKwPerGun: 60.0,
      });
    }

    const unthrottledDemandKw = currentActiveVehicles * 60.0;
    const capacityKw = transformer.transformerCapacityKva * 0.9; // Power factor 0.9
    const loadPercentage = (unthrottledDemandKw / capacityKw) * 100.0;

    const isThrottlingActive = loadPercentage > 80.0;
    const recommendedMaxKwPerGun = isThrottlingActive
      ? Math.max(22.0, Math.floor((capacityKw * 0.8) / Math.max(1, currentActiveVehicles)))
      : 60.0;

    transformer.activeChargingVehiclesCount = currentActiveVehicles;
    transformer.currentLoadKw = isThrottlingActive ? currentActiveVehicles * recommendedMaxKwPerGun : unthrottledDemandKw;
    transformer.loadPercentage = (transformer.currentLoadKw / capacityKw) * 100.0;
    transformer.isThrottlingActive = isThrottlingActive;
    transformer.recommendedMaxKwPerGun = recommendedMaxKwPerGun;

    const saved = await this.transformerRepo.save(transformer);

    return {
      stationId: saved.stationId,
      stationName: saved.stationName,
      gridSubstationName: saved.gridSubstationName,
      transformerCapacityKva: saved.transformerCapacityKva,
      currentLoadKw: Number(saved.currentLoadKw),
      loadPercentage: Number(saved.loadPercentage),
      isThrottlingActive: saved.isThrottlingActive,
      activeChargingVehiclesCount: saved.activeChargingVehiclesCount,
      recommendedMaxKwPerGun: Number(saved.recommendedMaxKwPerGun),
    };
  }

  async setChargingProfile(dto: SetSmartChargingProfileDto): Promise<OcppChargingProfileDto> {
    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + dto.durationMinutes * 60000);

    const profile = this.profileRepo.create({
      stationId: dto.stationId,
      connectorId: dto.connectorId,
      stackLevel: 1,
      chargingProfilePurpose: dto.purpose,
      chargingRateUnit: ChargingRateUnitType.WATTS,
      maxPowerKw: dto.maxPowerKw,
      startPeriodSeconds: 0,
      validFrom,
      validTo,
      isActive: true,
    });

    const saved = await this.profileRepo.save(profile);

    return {
      id: saved.id,
      stationId: saved.stationId,
      connectorId: saved.connectorId,
      stackLevel: saved.stackLevel,
      chargingProfilePurpose: saved.chargingProfilePurpose as ChargingProfilePurposeType,
      chargingRateUnit: saved.chargingRateUnit as ChargingRateUnitType,
      maxPowerKw: Number(saved.maxPowerKw),
      startPeriodSeconds: saved.startPeriodSeconds,
      validFrom: saved.validFrom.toISOString(),
      validTo: saved.validTo.toISOString(),
      isActive: saved.isActive,
    };
  }
}
