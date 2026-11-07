export enum MpptCouplingMode {
  DIRECT_SOLAR_DC = 'DIRECT_SOLAR_DC',
  SOLAR_PLUS_BESS_DC = 'SOLAR_PLUS_BESS_DC',
  GRID_SUPPLEMENTED = 'GRID_SUPPLEMENTED',
  CURTAILED_STANDBY = 'CURTAILED_STANDBY',
}

export interface SolarMpptCouplingSession {
  id: string;
  depotId: string;
  pvArrayId: string;
  chargerGunId: string;
  vehicleId: string;
  solarIrradianceWPerM2: number;
  mpptDcBusVoltageVolts: number;
  solarDcCurrentAmps: number;
  solarPowerKw: number;
  vehicleDemandKw: number;
  gridPowerImportKw: number;
  dcConversionEfficiencyPercent: number;
  avoidedAcDcLossKwh: number;
  couplingMode: MpptCouplingMode;
  sessionStartedAt: string;
  sessionEndedAt?: string;
  totalSolarEnergyDeliveredKwh: number;
  createdAt: string;
}

export interface LogMpptCouplingTelemetryDto {
  depotId: string;
  pvArrayId: string;
  chargerGunId: string;
  vehicleId: string;
  solarIrradianceWPerM2: number;
  mpptDcBusVoltageVolts: number;
  solarDcCurrentAmps: number;
  vehicleDemandKw: number;
}
