export type WarrantyProtectionAction = 'ALLOW_FAST_CHARGE' | 'DERATE_POWER' | 'BLOCK_AND_ROUTE_COOLING';

export interface BmsWarrantyReading {
  vehicleId: string;
  batterySerial: string;
  maxCellTemperatureCelsius: number;
  minCellTemperatureCelsius: number;
  cellTemperatureDeltaCelsius: number;
  requestedFastChargeKw: number;
}

export interface BmsWarrantyProtectionRecord {
  id: string;
  vehicleId: string;
  batterySerial: string;
  maxCellTemperatureCelsius: number;
  actionTaken: WarrantyProtectionAction;
  allowedPowerKw: number;
  depotCoolingBayAssigned?: string;
  warrantyProtectionActive: boolean;
  timestamp: string;
}

