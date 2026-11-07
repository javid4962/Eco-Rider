export type WeatherSeverity = 'CLEAR' | 'MODERATE_RAIN' | 'HEAVY_MONSOON' | 'DENSE_FOG';

export interface CorridorWeatherCondition {
  corridorId: string;
  corridorName: string; // e.g. "NH-16-BZA-GNT"
  precipitationMmPerHr: number;
  visibilityMeters: number;
  roadSurfaceCondition: 'DRY' | 'WET' | 'WATERLOGGED';
  severity: WeatherSeverity;
}

export interface WeatherSpeedDirective {
  corridorId: string;
  recommendedSpeedLimitKmph: number;
  standardSpeedLimitKmph: number;
  governorActive: boolean;
  reason: string;
  issuedAt: string;
}

export interface WeatherGovernorEventRecord {
  id: string;
  corridorId: string;
  severity: WeatherSeverity;
  precipitationMmPerHr: number;
  visibilityMeters: number;
  enforcedSpeedLimitKmph: number;
  vehiclesNotifiedCount: number;
  effectiveFrom: string;
}
