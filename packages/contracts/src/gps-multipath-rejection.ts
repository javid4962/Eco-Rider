export interface CanyonZone {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface RawGnssFix {
  vehicleId: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  speedKmph: number;
  hdop: number;
  satellitesInView: number;
  wheelTickSpeedKmph?: number;
  timestamp: string;
}

export interface FusedLocationTelemetry {
  id: string;
  vehicleId: string;
  filteredLatitude: number;
  filteredLongitude: number;
  isMultipathDetected: boolean;
  confidenceScore: number; // 0 to 1
  canyonZoneName?: string;
  correctedDriftMeters: number;
  timestamp: string;
}
