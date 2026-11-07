export enum CellDiagnosticHealth {
  NORMAL = 'NORMAL',
  ELEVATED_PRESSURE = 'ELEVATED_PRESSURE',
  CRITICAL_SWELLING = 'CRITICAL_SWELLING',
  THERMAL_RUNAWAY_RISK = 'THERMAL_RUNAWAY_RISK',
}

export interface CellDiagnosticGateLog {
  id: string;
  depotId: string;
  bayNumber: string;
  batteryPackSerial: string;
  vehicleId?: string;
  measuredSwellingMm: number;
  maxAllowableSwellingMm: number;
  internalGasPressureKPa: number;
  cellSurfaceTemperatureC: number;
  diagnosticHealth: CellDiagnosticHealth;
  chargingAllowed: boolean;
  quarantineTriggered: boolean;
  fireSuppressionPreArmed: boolean;
  inspectedAt: string;
}

export interface PerformCellDiagnosticDto {
  depotId: string;
  bayNumber: string;
  batteryPackSerial: string;
  vehicleId?: string;
  measuredSwellingMm: number;
  internalGasPressureKPa: number;
  cellSurfaceTemperatureC: number;
}
