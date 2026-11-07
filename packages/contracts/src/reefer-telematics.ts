export enum ReeferCargoCategory {
  PHARMACEUTICAL_VACCINE = 'PHARMACEUTICAL_VACCINE', // 2 to 8 deg C
  FROZEN_PERISHABLE = 'FROZEN_PERISHABLE',         // -20 to -15 deg C
  FRESH_PRODUCE = 'FRESH_PRODUCE',                 // 8 to 14 deg C
}

export enum ReeferCoolingStatus {
  OPTIMAL = 'OPTIMAL',
  EXCURSION_RISK = 'EXCURSION_RISK',
  CRITICAL_BREACH = 'CRITICAL_BREACH',
}

export interface ReeferTelemetryDto {
  vehicleId: string;
  consignmentId: string;
  cargoCategory: ReeferCargoCategory;
  targetTempCelsius: number;
  currentInternalTempCelsius: number;
  ambientTempCelsius: number;
  compressorRpm: number;
  batterySocPercent: number;
}

export interface ReeferAdjustmentResult {
  vehicleId: string;
  consignmentId: string;
  cargoCategory: ReeferCargoCategory;
  status: ReeferCoolingStatus;
  commandedSetpointCelsius: number;
  commandedCompressorRpm: number;
  requiresImmediateIntervention: boolean;
  telemetryTimestamp: string;
}
