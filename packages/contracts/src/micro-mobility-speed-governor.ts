export enum PedestrianZoneCategory {
  HERITAGE_PILGRIM_PRECINCT = 'HERITAGE_PILGRIM_PRECINCT', // 10 km/h limit
  COMMERCIAL_SHOPPING_STREET = 'COMMERCIAL_SHOPPING_STREET', // 12 km/h limit
  HOSPITAL_CAMPUS_ZONE = 'HOSPITAL_CAMPUS_ZONE',           // 10 km/h limit
  STANDARD_CYCLE_TRACK = 'STANDARD_CYCLE_TRACK',           // 25 km/h standard
}

export interface IngestMicroMobilityGpsDto {
  vehicleId: string;
  latitude: number;
  longitude: number;
  currentSpeedKmh: number;
  batterySocPercent: number;
}

export interface SpeedGovernorInstructionResult {
  vehicleId: string;
  isInPedestrianZone: boolean;
  zoneCategory: PedestrianZoneCategory;
  enforcedSpeedLimitKmh: number;
  throttleAdjustmentRequired: boolean;
  audibleChimeWarning: boolean;
  timestamp: string;
}
