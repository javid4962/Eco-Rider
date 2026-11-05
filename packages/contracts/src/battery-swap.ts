export enum BatteryPackModel {
  LFP_48V_30AH = 'LFP_48V_30AH',       // 2W / 3W standard pack
  LFP_60V_45AH = 'LFP_60V_45AH',       // Heavy 3W / Auto pack
  NMC_72V_60AH = 'NMC_72V_60AH',       // High-power commuter pack
}

export enum BatteryHealthStatus {
  EXCELLENT = 'EXCELLENT',             // SoH >= 95%
  GOOD = 'GOOD',                       // SoH 85% - 94%
  DEGRADED = 'DEGRADED',               // SoH 70% - 84%
  RETIRE_PENDING = 'RETIRE_PENDING',   // SoH < 70% (Second-life energy storage)
}

export enum SwapStationStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE = 'MAINTENANCE',
  DEPLETED_INVENTORY = 'DEPLETED_INVENTORY',
  OFFLINE = 'OFFLINE',
}

export interface BatterySwapStationDto {
  id: string;
  stationCode: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  operator: string;
  totalBays: number;
  availableChargedPacks: number;
  chargingPacks: number;
  supportedModels: BatteryPackModel[];
  swapFeePaise: number;
  formattedSwapFee: string;
  status: SwapStationStatus;
}

export interface BatteryPackDto {
  id: string;
  serialNumber: string;
  model: BatteryPackModel;
  capacityKwh: number;
  currentSocPercent: number;
  stateOfHealthPercent: number;
  cycleCount: number;
  temperatureCelsius: number;
  healthStatus: BatteryHealthStatus;
  stationId: string | null;
  assignedVehicleId: string | null;
  isReadyForSwap: boolean;
}

export interface ExecuteBatterySwapDto {
  stationId: string;
  vehicleRegistrationNumber: string;
  depositedPackSerial: string;
  depositedPackSocPercent: number;
  requestedModel: BatteryPackModel;
  idempotencyKey?: string;
}

export interface BatterySwapReceiptDto {
  swapTransactionId: string;
  stationCode: string;
  stationName: string;
  vehicleRegistrationNumber: string;
  depositedPackSerial: string;
  depositedSocPercent: number;
  dispensedPackSerial: string;
  dispensedSocPercent: number;
  stateOfHealthPercent: number;
  energyReplenishedKwh: number;
  baseSwapFeePaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  formattedAmount: string;
  swappedAt: string;
}

