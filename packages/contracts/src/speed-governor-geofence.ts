export enum UrbanZoneType {
  TEMPLE_PEDESTRIAN_ZONE = 'TEMPLE_PEDESTRIAN_ZONE', // e.g. Kanaka Durga Temple precincts (Max 20 km/h)
  SCHOOL_HOSPITAL_ZONE = 'SCHOOL_HOSPITAL_ZONE',       // Max 25 km/h
  COMMERCIAL_MARKET_CORRIDOR = 'COMMERCIAL_MARKET_CORRIDOR', // Max 30 km/h
  STANDARD_ARTERIAL = 'STANDARD_ARTERIAL',             // Standard speed (Max 50 km/h)
}

export interface CheckSpeedGovernorGeofenceDto {
  vehicleId: string;
  latitude: number;
  longitude: number;
  currentSpeedKmph: number;
  zoneType: UrbanZoneType;
}

export interface SpeedGovernorGeofenceResult {
  zoneType: UrbanZoneType;
  mandatedSpeedLimitKmph: number;
  isViolation: boolean;
  throttleLimitPercent: number; // e.g. 40% if violation, 100% if normal
  hapticWarningIssued: boolean;
  loggedAt: Date;
}

