export enum FloodRiskSeverity {
  SAFE_DRY = 'SAFE_DRY',
  LOW_WATER_CAUTION = 'LOW_WATER_CAUTION',
  CRITICAL_SUBMERSION_RISK = 'CRITICAL_SUBMERSION_RISK',
}

export enum VehicleClearanceClass {
  SEDAN_HATCHBACK_4W = 'SEDAN_HATCHBACK_4W', // Max safe depth: 150mm
  SUV_PREMIUM_4W = 'SUV_PREMIUM_4W',         // Max safe depth: 250mm
  AUTO_RICKSHAW_3W = 'AUTO_RICKSHAW_3W',     // Max safe depth: 180mm
}

export interface IngestFloodDepthDto {
  corridorSegmentId: string;
  sensorLocation: string;
  waterDepthMm: number;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export interface FloodRerouteEvaluationResult {
  corridorSegmentId: string;
  waterDepthMm: number;
  severity: FloodRiskSeverity;
  prohibitedClasses: VehicleClearanceClass[];
  isCorridorClosed: boolean;
  recommendedDetour: string | null;
  assessedAt: string;
}

