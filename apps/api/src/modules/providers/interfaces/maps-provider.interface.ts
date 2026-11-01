export interface GeoPoint {
  latitude: number;
  longitude: number;
}

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
}
