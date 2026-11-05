export enum SpeedZoneType {
  SCHOOL_ZONE = 'SCHOOL_ZONE',         // 25 km/h
  HOSPITAL_ZONE = 'HOSPITAL_ZONE',     // 30 km/h
  RESIDENTIAL_ZONE = 'RESIDENTIAL_ZONE', // 40 km/h
  URBAN_ARTERIAL = 'URBAN_ARTERIAL',   // 50 km/h
  HIGHWAY_CORRIDOR = 'HIGHWAY_CORRIDOR', // 70 km/h
}

export interface SpeedLimitZoneDto {
  id: string;
  zoneCode: string;
  zoneName: string;
  city: string;
  zoneType: SpeedZoneType;
  maxSpeedKmph: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface IngestSpeedTelemetryDto {
  vehicleRegistrationNumber: string;
  captainId: string;
  latitude: number;
  longitude: number;
  speedKmph: number;
  recordedAt: string;
}

export interface SpeedViolationIncidentDto {
  incidentId: string;
  vehicleRegistrationNumber: string;
  captainId: string;
  zoneCode: string;
  speedLimitKmph: number;
  actualSpeedKmph: number;
  excessSpeedKmph: number;
  safetyScorePenalty: number;
  warningNoticeTelugu: string;
  warningNoticeEnglish: string;
  recordedAt: string;
}

