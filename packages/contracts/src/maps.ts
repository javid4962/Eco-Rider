/**
 * EcoRide Maps, Geocoding & Route Provider Contracts (EV-032)
 *
 * Defines contracts for address autocompletion suggestions, reverse geocoding,
 * route distance/duration/ETA computation, coordinate bounds validation,
 * fault injection simulation modes, and caching thresholds.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Andhra Pradesh geographic envelope bounds:
 * Latitude: ~12.5°N (Kuppam/Chittoor) to ~19.9°N (Ichchapuram/Srikakulam)
 * Longitude: ~76.5°E (Anantapur) to ~84.8°E (Srikakulam coast)
 */
export const ANDHRA_PRADESH_BOUNDS = Object.freeze({
  minLatitude: 12.5,
  maxLatitude: 19.9,
  minLongitude: 76.5,
  maxLongitude: 84.8,
});

export enum ProviderSimulationMode {
  NORMAL = 'NORMAL',
  TIMEOUT = 'TIMEOUT',
  DOWNTIME = 'DOWNTIME',
  DEGRADED = 'DEGRADED',
  RATE_LIMITED = 'RATE_LIMITED',
}

export interface CoordinateValidationResult {
  isValid: boolean;
  latitude: number;
  longitude: number;
  isWithinAndhraPradesh: boolean;
  rejectionReason?: string | null;
}

export interface AddressSuggestion {
  id: string;
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullAddress: string;
  city: string;
  district?: string;
  coordinates: GeoPoint;
}

export interface AddressSuggestionsRequest {
  query: string;
  city?: string;
  limit?: number;
}

export interface AddressSuggestionsResponse {
  suggestions: AddressSuggestion[];
  query: string;
  city?: string;
  totalFound: number;
  isFallback: boolean;
}

export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResponse {
  fullAddress: string;
  primaryName: string;
  city: string;
  district?: string;
  state: string;
  postalCode?: string;
  coordinates: GeoPoint;
  isWithinAndhraPradesh: boolean;
  isFallback: boolean;
  warning?: string;
}

export interface RouteCalculationRequest {
  origin: GeoPoint;
  destination: GeoPoint;
  serviceCategory?: string;
  avoidTolls?: boolean;
}

export interface RouteCalculationResponse {
  distanceMeters: number;
  durationSeconds: number;
  etaMinutes: number;
  etaTimestamp: string;
  encodedPolyline: string;
  polylinePoints: GeoPoint[];
  estimatedEnergyKwh: number;
  isFallback: boolean;
  computedAt: string;
  warning?: string;
}

export interface MapProviderStatus {
  providerName: string;
  isHealthy: boolean;
  cacheEntriesCount: number;
  maxCacheSize: number;
  cacheHitsCount: number;
  cacheMissesCount: number;
  cacheHitRatio: number;
  activeSimulationMode: ProviderSimulationMode;
  timeoutMs: number;
  maxRetries: number;
}

export interface SimulateFaultRequest {
  simulationMode: ProviderSimulationMode;
  delayMs?: number;
}

