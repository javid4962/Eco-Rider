export enum BmsThermalSafetyLevel {
  NORMAL = 'NORMAL',               // Cell temp <= 45°C
  ELEVATED = 'ELEVATED',           // Cell temp 46°C - 55°C (warning, cooling fan boost)
  CRITICAL_OVERHEAT = 'CRITICAL',  // Cell temp > 55°C (immediate dispatch lockout)
  THERMAL_RUNAWAY_RISK = 'RUNAWAY' // Sudden delta > 2°C/sec or temp > 65°C (emergency shutdown)
}

export interface BmsTelemetryPingDto {
  vehicleId: string;
  vehicleRegistrationNumber: string;
  packVoltageVolts: number;
  packCurrentAmperes: number;
  cellVoltageMaxVolts: number;
  cellVoltageMinVolts: number;
  cellVoltageDeltaMv: number;       // Max - Min in millivolts
  maxCellTempCelsius: number;
  minCellTempCelsius: number;
  inverterTempCelsius: number;
  motorRpm: number;
  energyConsumptionWhPerKm: number;
  stateOfChargePercent: number;
  stateOfHealthPercent: number;
  bmsThermalSafetyLevel: BmsThermalSafetyLevel;
  faultCodes: string[];
  recordedAt: string;
}

export interface BmsAnomalyAlertDto {
  id: string;
  vehicleId: string;
  vehicleRegistrationNumber: string;
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  issue: string;
  diagnosticData: Record<string, any>;
  autoLockoutApplied: boolean;
  alertTimestamp: string;
}

