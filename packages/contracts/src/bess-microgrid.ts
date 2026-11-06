/**
 * M81: Solar-Powered Depot Micro-Grid Energy Storage System (BESS) Orchestration
 * Onsite battery storage dispatch and solar peak-shaving at AP EV depots.
 */

export enum BessOperatingMode {
  SOLAR_CHARGING = 'SOLAR_CHARGING', // Irradiance high, charging BESS
  GRID_PEAK_DISCHARGING = 'GRID_PEAK_DISCHARGING', // Discharging to vehicle chargers during evening grid peak
  IDLE_STANDBY = 'IDLE_STANDBY',
  EMERGENCY_RESERVE = 'EMERGENCY_RESERVE',
}

export interface BessTelemetryDto {
  depotId: string;
  bessUnitCode: string; // e.g. BESS-AMARAVATHI-01
  totalCapacityKwh: number;
  currentSocPercent: number;
  chargeRateKw: number;
  dischargeRateKw: number;
  temperatureCelsius: number;
  solarInputKw: number;
  gridPowerDemandKw: number;
}

export interface BessDispatchDecisionResult {
  bessUnitCode: string;
  mode: BessOperatingMode;
  targetPowerKw: number;
  peakShavingReliefKw: number;
  estimatedCostSavingsPaise: number; // Avoided peak grid tariff ₹11.50 vs solar ₹6.50
  timestamp: string;
  reason: string;
}
