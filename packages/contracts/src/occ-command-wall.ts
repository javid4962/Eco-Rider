export enum OccOperationalPosture {
  NORMAL_CIVIL_OPERATION = 'NORMAL_CIVIL_OPERATION',
  CYCLONE_EMERGENCY_MOBILITY = 'CYCLONE_EMERGENCY_MOBILITY',
  GRID_BLACKOUT_ISLANDING = 'GRID_BLACKOUT_ISLANDING',
  MASS_TRANSIT_STRIKE_BACKUP = 'MASS_TRANSIT_STRIKE_BACKUP',
}

export interface OccSystemHealthSummary {
  activePassengerVehicles: number;
  activeCargoVans: number;
  activeMicroMobilityUnits: number;
  chargingGunUtilizationPercent: number;
  bessStoredEnergyKwh: number;
  activeAlertsCount: number;
  posture: OccOperationalPosture;
  lastUpdated: string;
}

export interface OccEscalationIncidentDto {
  incidentCode: string;
  sourceMilestone: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  targetZone: string;
  recommendedPosture: OccOperationalPosture;
}

export interface OccPostureSwitchResult {
  incidentId: string;
  previousPosture: OccOperationalPosture;
  newPosture: OccOperationalPosture;
  activatedAt: string;
  authorizedBy: string;
  systemBroadcastSent: boolean;
  affectedVehicleCount: number;
}

