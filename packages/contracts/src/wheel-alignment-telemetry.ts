export enum AlignmentStatus {
  PERFECT = 'PERFECT',
  MINOR_DRIFT = 'MINOR_DRIFT',
  MODERATE_MISALIGNMENT = 'MODERATE_MISALIGNMENT',
  CRITICAL_TIRE_SCRUB = 'CRITICAL_TIRE_SCRUB',
}

export interface WheelAlignmentLog {
  id: string;
  vehicleId: string;
  captainId: string;
  rollingWindowKm: number;
  steeringAngleMeanOffsetDeg: number;
  lateralDriftRateMps2: number;
  yawRateVariance: number;
  tireScrubSeverityIndex: number;
  estimatedTireLifeReductionPercent: number;
  alignmentStatus: AlignmentStatus;
  depotMaintenanceRequired: boolean;
  maintenanceWorkOrderRef?: string;
  loggedAt: string;
}

export interface IngestWheelAlignmentDto {
  vehicleId: string;
  captainId: string;
  rollingWindowKm: number;
  steeringAngleMeanOffsetDeg: number;
  lateralDriftRateMps2: number;
  yawRateVariance: number;
}
