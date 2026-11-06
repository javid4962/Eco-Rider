/**
 * M78: Multi-Vendor Battery Swapping Compatibility Protocol (AIS-156 Amendment 3 Compliance)
 * Interoperable battery pack standard with thermal runaway safeguards and standardized CAN/RS485 messaging.
 */

export enum BatteryVendorStandard {
  SUN_MOBILITY_QPU = 'SUN_MOBILITY_QPU',
  BATTERY_SMART_STD = 'BATTERY_SMART_STD',
  ECORIDE_INDIGENOUS = 'ECORIDE_INDIGENOUS',
  RACEENERGY_SWAP = 'RACEENERGY_SWAP',
}

export enum Ais156SafetyVerdict {
  SAFE_FOR_DEPLOYMENT = 'SAFE_FOR_DEPLOYMENT',
  THERMAL_RUNAWAY_RISK = 'THERMAL_RUNAWAY_RISK',
  CELL_IMBALANCE_WARNING = 'CELL_IMBALANCE_WARNING',
  INSULATION_RESISTANCE_FAULT = 'INSULATION_RESISTANCE_FAULT',
}

export interface Ais156TelemetryDto {
  packSerialNumber: string;
  vendorStandard: BatteryVendorStandard;
  maxCellTemperatureCelsius: number;
  minCellTemperatureCelsius: number;
  cellVoltageMaxVolts: number;
  cellVoltageMinVolts: number;
  insulationResistanceMegaOhms: number;
  socPercent: number;
  sohPercent: number;
  cycleCount: number;
  waterIngressDetected: boolean;
}

export interface Ais156ComplianceVerdictResult {
  packSerialNumber: string;
  vendorStandard: BatteryVendorStandard;
  verdict: Ais156SafetyVerdict;
  isEligibleForSwap: boolean;
  deltaCellVoltageMillivolts: number;
  deltaTemperatureCelsius: number;
  safetyInterlockEngaged: boolean;
  reason: string;
}

