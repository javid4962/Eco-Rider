import {
  AddressSuggestion,
  CoordinateValidationResult,
  GeoPoint,
  ProviderSimulationMode,
  ReverseGeocodeResponse,
} from '@ecoride/contracts';

export { GeoPoint };

export interface DistanceMatrixResult {
  distanceMeters: number;
  durationSeconds: number;
  estimatedConsumptionKwh: number;
}

export interface RoutePolylineResult {
  encodedPolyline: string;
  points: GeoPoint[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface IMapsProvider {
  calculateDistanceMatrix(origin: GeoPoint, destination: GeoPoint): Promise<DistanceMatrixResult>;
  getRoute(origin: GeoPoint, destination: GeoPoint): Promise<RoutePolylineResult>;
  reverseGeocode(point: GeoPoint): Promise<string>;
  isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean;

  // EV-032 Maps, Geocoding & Route Provider Abstraction additions:
  suggestAddresses(query: string, city?: string, limit?: number): Promise<AddressSuggestion[]>;
  reverseGeocodeDetails(point: GeoPoint): Promise<ReverseGeocodeResponse>;
  validateCoordinates(point: GeoPoint): CoordinateValidationResult;
  setSimulationMode(mode: ProviderSimulationMode, delayMs?: number): void;
  getSimulationMode(): ProviderSimulationMode;
}
