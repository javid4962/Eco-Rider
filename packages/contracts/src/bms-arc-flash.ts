export enum ArcFlashHazardLevel {
  NOMINAL = 'NOMINAL',
  ELEVATED_IMPEDANCE = 'ELEVATED_IMPEDANCE',
  CRITICAL_PRECURSOR_DETECTED = 'CRITICAL_PRECURSOR_DETECTED',
  EMERGENCY_ISOLATION_TRIGGERED = 'EMERGENCY_ISOLATION_TRIGGERED',
}

export interface EvaluateArcFlashTelemetryDto {
  vehicleId: string;
  packSerial: string;
  packVoltage: number;
  maxCellDifferentialMilliVolts: number;
  internalResistanceMilliOhms: number;
  temperatureRateOfRiseCelsiusPerSec: number;
}

export interface ArcFlashTelemetryResult {
  evaluationId: string;
  vehicleId: string;
  hazardLevel: ArcFlashHazardLevel;
  contactorIsolationCommanded: boolean;
  aerosolSuppressionArmed: boolean;
  recommendedDriverAdvisory: string;
  evaluatedAt: Date;
}

