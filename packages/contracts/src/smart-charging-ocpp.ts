export enum ChargingProfilePurposeType {
  CHARGE_POINT_MAX_PROFILE = 'CHARGE_POINT_MAX_PROFILE',
  TX_DEFAULT_PROFILE = 'TX_DEFAULT_PROFILE',
  TX_PROFILE = 'TX_PROFILE',
}

export enum ChargingRateUnitType {
  WATTS = 'W',
  AMPERES = 'A',
}

export interface OcppChargingProfileDto {
  id: string;
  stationId: string;
  connectorId: number;
  stackLevel: number;
  chargingProfilePurpose: ChargingProfilePurposeType;
  chargingRateUnit: ChargingRateUnitType;
  maxPowerKw: number;
  startPeriodSeconds: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface TransformerLoadStatusDto {
  stationId: string;
  stationName: string;
  gridSubstationName: string;
  transformerCapacityKva: number;
  currentLoadKw: number;
  loadPercentage: number;
  isThrottlingActive: boolean;
  activeChargingVehiclesCount: number;
  recommendedMaxKwPerGun: number;
}

export interface SetSmartChargingProfileDto {
  stationId: string;
  connectorId: number;
  maxPowerKw: number;
  purpose: ChargingProfilePurposeType;
  durationMinutes: number;
}

