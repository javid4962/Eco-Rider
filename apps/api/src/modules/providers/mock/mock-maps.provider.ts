import { Injectable } from '@nestjs/common';
import {
  IMapsProvider,
  GeoPoint,
  DistanceMatrixResult,
  RoutePolylineResult,
} from '../interfaces/maps-provider.interface';

@Injectable()
export class MockMapsProvider implements IMapsProvider {
  private readonly knownLandmarks: Array<{ name: string; point: GeoPoint; radiusKm: number }> = [
    {
      name: 'RK Beach, Visakhapatnam',
      point: { latitude: 17.7142, longitude: 83.3235 },
      radiusKm: 1.5,
    },
    {
      name: 'MVP Colony Sector 1, Visakhapatnam',
      point: { latitude: 17.7412, longitude: 83.3371 },
      radiusKm: 2.0,
    },
    {
      name: 'Dwaraka Nagar RTC Complex, Visakhapatnam',
      point: { latitude: 17.7275, longitude: 83.3038 },
      radiusKm: 1.5,
    },
    {
      name: 'Visakhapatnam Railway Station Junction',
      point: { latitude: 17.7215, longitude: 83.2906 },
      radiusKm: 1.5,
    },
    {
      name: 'Rushikonda IT SEZ & Hill 2, Visakhapatnam',
      point: { latitude: 17.7818, longitude: 83.3776 },
      radiusKm: 2.5,
    },
    {
      name: 'Gajuwaka Industrial Junction, Visakhapatnam',
      point: { latitude: 17.6908, longitude: 83.2085 },
      radiusKm: 3.0,
    },
    {
      name: 'Benz Circle, Vijayawada',
      point: { latitude: 16.4975, longitude: 80.6558 },
      radiusKm: 2.0,
    },
    {
      name: 'Pandit Nehru Bus Station (PNBS), Vijayawada',
      point: { latitude: 16.5085, longitude: 80.6178 },
      radiusKm: 2.0,
    },
  ];

  /**
   * Calculates spherical distance, urban driving duration, and EV energy consumption
   * using zero billable external API calls.
   */
  async calculateDistanceMatrix(
    origin: GeoPoint,
    destination: GeoPoint,
  ): Promise<DistanceMatrixResult> {
    const distanceMeters = this.calculateHaversineDistance(origin, destination);
    // Urban driving factor: 1.25x road winding factor
    const roadDistanceMeters = Math.round(distanceMeters * 1.25);

    // Urban AP driving speed: ~28 km/h = ~7.78 m/s
    const durationSeconds = Math.max(120, Math.round(roadDistanceMeters / 7.78));

    // Commercial EV consumption: ~0.08 kWh per km on average
    const roadDistanceKm = roadDistanceMeters / 1000;
    const estimatedConsumptionKwh = Math.round(roadDistanceKm * 0.08 * 100) / 100;

    return {
      distanceMeters: roadDistanceMeters,
      durationSeconds,
      estimatedConsumptionKwh,
    };
  }

  /**
   * Generates synthetic route points and mock encoded polyline between AP locations.
   */
  async getRoute(origin: GeoPoint, destination: GeoPoint): Promise<RoutePolylineResult> {
    const matrix = await this.calculateDistanceMatrix(origin, destination);
    const steps = 5;
    const points: GeoPoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      points.push({
        latitude:
          Math.round(
            (origin.latitude + (destination.latitude - origin.latitude) * fraction) * 1e6,
          ) / 1e6,
        longitude:
          Math.round(
            (origin.longitude + (destination.longitude - origin.longitude) * fraction) * 1e6,
          ) / 1e6,
      });
    }

    const syntheticPolyline = `mock_poly_${Math.round(origin.latitude * 100)}_${Math.round(origin.longitude * 100)}_to_${Math.round(destination.latitude * 100)}_${Math.round(destination.longitude * 100)}`;

    return {
      encodedPolyline: syntheticPolyline,
      points,
      distanceMeters: matrix.distanceMeters,
      durationSeconds: matrix.durationSeconds,
    };
  }

  /**
   * Reverse geocodes coordinates to known AP urban landmarks, or fallback AP coordinate string.
   */
  async reverseGeocode(point: GeoPoint): Promise<string> {
    for (const landmark of this.knownLandmarks) {
      const dist = this.calculateHaversineDistance(point, landmark.point) / 1000;
      if (dist <= landmark.radiusKm) {
        return `${landmark.name} (~${Math.round(dist * 1000)}m)`;
      }
    }
    return `AP Urban Point (${point.latitude.toFixed(4)}°N, ${point.longitude.toFixed(4)}°E)`;
  }

  /**
   * Performs standard ray-casting algorithm to test whether a point falls within a polygon.
   */
  isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].latitude;
      const yi = polygon[i].longitude;
      const xj = polygon[j].latitude;
      const yj = polygon[j].longitude;

      const intersect =
        yi > point.longitude !== yj > point.longitude &&
        point.latitude < ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private calculateHaversineDistance(p1: GeoPoint, p2: GeoPoint): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(p2.latitude - p1.latitude);
    const dLon = toRad(p2.longitude - p1.longitude);
    const lat1 = toRad(p1.latitude);
    const lat2 = toRad(p2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}
