export enum RoadConditionState {
  DRY_HIGH_TRACTION = 'DRY_HIGH_TRACTION',
  WET_ASPHALT_MODERATE = 'WET_ASPHALT_MODERATE',
  FLOODED_HYDROPLANE_RISK = 'FLOODED_HYDROPLANE_RISK',
}

export enum MonsoonAdaptiveMode {
  NORMAL_DRIVE = 'NORMAL_DRIVE',
  TRACTION_STABILITY_ASSIST = 'TRACTION_STABILITY_ASSIST',
  EXTREME_MONSOON_CRAWL = 'EXTREME_MONSOON_CRAWL',
}

export interface RoadSurfaceTelemetryDto {
  vehicleId: string;
  latitude: number;
  longitude: number;
  surfaceFrictionMu: number; // 0.0 - 1.0 (e.g. 0.8 dry, 0.35 wet, 0.15 icy/hydroplane)
  wheelSlipPercent: number;  // 0 - 100
  wiperSpeedLevel: number;   // 0 - 3
  rainSensorMmPerHour: number;
}

export interface MonsoonTractionControlResult {
  vehicleId: string;
  roadCondition: RoadConditionState;
  recommendedMode: MonsoonAdaptiveMode;
  maxTorqueLimitPercent: number;
  maxSpeedLimitKmh: number;
  warningAlert: string | null;
  timestamp: string;
}

