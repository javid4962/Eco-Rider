import { Injectable, Logger } from '@nestjs/common';
import {
  AddressSuggestion,
  ANDHRA_PRADESH_BOUNDS,
  CoordinateValidationResult,
  GeoPoint,
  ProviderSimulationMode,
  ReverseGeocodeResponse,
} from '@ecoride/contracts';
import {
  DistanceMatrixResult,
  IMapsProvider,
  RoutePolylineResult,
} from '../interfaces/maps-provider.interface';

interface LandmarkData {
  id: string;
  name: string;
  primaryText: string;
  secondaryText: string;
  fullAddress: string;
  city: string;
  district: string;
  postalCode: string;
  point: GeoPoint;
  radiusKm: number;
}

@Injectable()
export class MockMapsProvider implements IMapsProvider {
  private readonly logger = new Logger(MockMapsProvider.name);
  private simulationMode: ProviderSimulationMode = ProviderSimulationMode.NORMAL;
  private simulationDelayMs: number = 0;

  private readonly knownLandmarks: LandmarkData[] = [
    {
      id: 'ap-vzg-001',
      name: 'RK Beach, Visakhapatnam',
      primaryText: 'RK Beach',
      secondaryText: 'Beach Road, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'RK Beach, Marine Drive, Pandurangapuram, Visakhapatnam, Andhra Pradesh 530002',
      city: 'visakhapatnam',
      district: 'Visakhapatnam',
      postalCode: '530002',
      point: { latitude: 17.7142, longitude: 83.3235 },
      radiusKm: 1.5,
    },
    {
      id: 'ap-vzg-002',
      name: 'MVP Colony Sector 1, Visakhapatnam',
      primaryText: 'MVP Colony Sector 1',
      secondaryText: 'MVP Double Road, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'MVP Colony Sector 1, MVP Double Road, Visakhapatnam, Andhra Pradesh 530017',
      city: 'visakhapatnam',
      district: 'Visakhapatnam',
      postalCode: '530017',
      point: { latitude: 17.7412, longitude: 83.3371 },
      radiusKm: 2.0,
    },
    {
      id: 'ap-vzg-003',
      name: 'Dwaraka Nagar RTC Complex, Visakhapatnam',
      primaryText: 'Dwaraka Nagar RTC Complex',
      secondaryText: 'Main Bus Station, Visakhapatnam, Andhra Pradesh',
      fullAddress:
        'Dwaraka Bus Station (RTC Complex), Old Jail Road, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016',
      city: 'visakhapatnam',
      district: 'Visakhapatnam',
      postalCode: '530016',
      point: { latitude: 17.7275, longitude: 83.3038 },
      radiusKm: 1.5,
    },
    {
      id: 'ap-vzg-004',
      name: 'Visakhapatnam Railway Station Junction',
      primaryText: 'Visakhapatnam Railway Station',
      secondaryText: 'Railway Station Road, Visakhapatnam, Andhra Pradesh',
      fullAddress:
        'Visakhapatnam Railway Station Junction (VSKP), Railway Station Road, Visakhapatnam, Andhra Pradesh 530004',
      city: 'visakhapatnam',
      district: 'Visakhapatnam',
      postalCode: '530004',
      point: { latitude: 17.7215, longitude: 83.2906 },
      radiusKm: 1.5,
    },
    {
      id: 'ap-vzg-005',
      name: 'Rushikonda IT SEZ & Hill 2, Visakhapatnam',
      primaryText: 'Rushikonda IT SEZ',
      secondaryText: 'Hill No. 2, Rushikonda, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'Rushikonda IT SEZ & Hill 2, Rushikonda, Visakhapatnam, Andhra Pradesh 530045',
      city: 'visakhapatnam',
      district: 'Visakhapatnam',
      postalCode: '530045',
      point: { latitude: 17.7818, longitude: 83.3776 },
      radiusKm: 2.5,
    },
    {
      id: 'ap-vzg-006',
      name: 'Gajuwaka Industrial Junction, Visakhapatnam',
      primaryText: 'Gajuwaka Industrial Junction',
      secondaryText: 'Old Gajuwaka, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'Gajuwaka Junction, Main Road, Gajuwaka, Visakhapatnam, Andhra Pradesh 530026',
      city: 'visakhapatnam',
      district: 'Visakhapatnam',
      postalCode: '530026',
      point: { latitude: 17.6908, longitude: 83.2085 },
      radiusKm: 3.0,
    },
    {
      id: 'ap-vzg-007',
      name: 'Simhachalam Temple Hill, Visakhapatnam',
      primaryText: 'Simhachalam Temple',
      secondaryText: 'Simhachalam, Visakhapatnam, Andhra Pradesh',
      fullAddress:
        'Varaha Lakshmi Narasimha Temple, Simhachalam Hill, Visakhapatnam, Andhra Pradesh 530028',
      city: 'visakhapatnam',
      district: 'Visakhapatnam',
      postalCode: '530028',
      point: { latitude: 17.7665, longitude: 83.2505 },
      radiusKm: 2.0,
    },
    {
      id: 'ap-vja-001',
      name: 'Benz Circle, Vijayawada',
      primaryText: 'Benz Circle',
      secondaryText: 'MG Road, Vijayawada, Andhra Pradesh',
      fullAddress: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
      city: 'vijayawada',
      district: 'NTR',
      postalCode: '520010',
      point: { latitude: 16.4975, longitude: 80.6558 },
      radiusKm: 2.0,
    },
    {
      id: 'ap-vja-002',
      name: 'Pandit Nehru Bus Station (PNBS), Vijayawada',
      primaryText: 'Pandit Nehru Bus Station (PNBS)',
      secondaryText: 'NH-65, Vijayawada, Andhra Pradesh',
      fullAddress: 'Pandit Nehru Bus Station, Krishnalanka, Vijayawada, Andhra Pradesh 520013',
      city: 'vijayawada',
      district: 'NTR',
      postalCode: '520013',
      point: { latitude: 16.5085, longitude: 80.6178 },
      radiusKm: 2.0,
    },
    {
      id: 'ap-vja-003',
      name: 'Kanaka Durga Temple, Vijayawada',
      primaryText: 'Kanaka Durga Temple',
      secondaryText: 'Indrakeeladri Hill, Vijayawada, Andhra Pradesh',
      fullAddress:
        'Sri Durga Malleswara Swamy Varla Devasthanam, Indrakeeladri, Vijayawada, Andhra Pradesh 520001',
      city: 'vijayawada',
      district: 'NTR',
      postalCode: '520001',
      point: { latitude: 16.5152, longitude: 80.6053 },
      radiusKm: 1.5,
    },
    {
      id: 'ap-amr-001',
      name: 'AP Secretariat Velagapudi, Amaravati',
      primaryText: 'AP Government Secretariat',
      secondaryText: 'Velagapudi, Amaravati Capital Region, Andhra Pradesh',
      fullAddress: 'Andhra Pradesh State Secretariat, Velagapudi, Amaravati, Andhra Pradesh 522238',
      city: 'amaravati',
      district: 'Guntur',
      postalCode: '522238',
      point: { latitude: 16.5412, longitude: 80.5155 },
      radiusKm: 2.5,
    },
    {
      id: 'ap-gnt-001',
      name: 'Brodipet Main Road, Guntur',
      primaryText: 'Brodipet Main Road',
      secondaryText: 'Guntur Central, Andhra Pradesh',
      fullAddress: 'Brodipet 4th Lane, Guntur, Andhra Pradesh 522002',
      city: 'guntur',
      district: 'Guntur',
      postalCode: '522002',
      point: { latitude: 16.3067, longitude: 80.4365 },
      radiusKm: 2.0,
    },
    {
      id: 'ap-tpt-001',
      name: 'Alipiri Toll Plaza, Tirupati',
      primaryText: 'Alipiri Toll Gate & Bus Stand',
      secondaryText: 'Foothills, Tirupati, Andhra Pradesh',
      fullAddress: 'Alipiri Toll Gate, Tirumala Ghat Road, Tirupati, Andhra Pradesh 517507',
      city: 'tirupati',
      district: 'Tirupati',
      postalCode: '517507',
      point: { latitude: 13.655, longitude: 79.398 },
      radiusKm: 2.0,
    },
  ];

  setSimulationMode(mode: ProviderSimulationMode, delayMs = 0): void {
    this.simulationMode = mode;
    this.simulationDelayMs = delayMs;
    this.logger.log(`MockMapsProvider simulation mode updated: ${mode} (delay: ${delayMs}ms)`);
  }

  getSimulationMode(): ProviderSimulationMode {
    return this.simulationMode;
  }

  /**
   * Applies simulated faults (timeout, downtime, latency, rate limits).
   */
  private async applySimulationFaults(): Promise<void> {
    switch (this.simulationMode) {
      case ProviderSimulationMode.TIMEOUT: {
        // Delay beyond standard timeout threshold to simulate upstream hang
        const timeoutDelay = Math.max(4000, this.simulationDelayMs || 5000);
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, timeoutDelay);
          if (typeof timer === 'object' && typeof (timer as NodeJS.Timeout).unref === 'function') {
            (timer as NodeJS.Timeout).unref();
          }
        });
        throw new Error(`Upstream Maps Provider Request Timed Out (${timeoutDelay}ms elapsed)`);
      }

      case ProviderSimulationMode.DOWNTIME:
        throw new Error('Upstream Maps Provider 500 Internal Server Error: Gateway down');

      case ProviderSimulationMode.RATE_LIMITED:
        throw new Error('Upstream Maps Provider 429 Too Many Requests: Quota exceeded');

      case ProviderSimulationMode.DEGRADED: {
        const degradedDelay = Math.max(500, this.simulationDelayMs || 500);
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, degradedDelay);
          if (typeof timer === 'object' && typeof (timer as NodeJS.Timeout).unref === 'function') {
            (timer as NodeJS.Timeout).unref();
          }
        });
        break;
      }

      case ProviderSimulationMode.NORMAL:
      default:
        break;
    }
  }

  /**
   * Validates GPS coordinate inputs for mathematical validity and AP boundary inclusion.
   */
  validateCoordinates(point: GeoPoint): CoordinateValidationResult {
    if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
      return {
        isValid: false,
        latitude: point?.latitude ?? NaN,
        longitude: point?.longitude ?? NaN,
        isWithinAndhraPradesh: false,
        rejectionReason: 'Coordinates must contain numeric latitude and longitude values.',
      };
    }

    if (
      isNaN(point.latitude) ||
      isNaN(point.longitude) ||
      !isFinite(point.latitude) ||
      !isFinite(point.longitude)
    ) {
      return {
        isValid: false,
        latitude: point.latitude,
        longitude: point.longitude,
        isWithinAndhraPradesh: false,
        rejectionReason:
          'Coordinates must be valid finite numbers (NaN and Infinity are disallowed).',
      };
    }

    if (point.latitude < -90 || point.latitude > 90) {
      return {
        isValid: false,
        latitude: point.latitude,
        longitude: point.longitude,
        isWithinAndhraPradesh: false,
        rejectionReason: `Latitude ${point.latitude} is invalid. Must be between -90 and 90 degrees.`,
      };
    }

    if (point.longitude < -180 || point.longitude > 180) {
      return {
        isValid: false,
        latitude: point.latitude,
        longitude: point.longitude,
        isWithinAndhraPradesh: false,
        rejectionReason: `Longitude ${point.longitude} is invalid. Must be between -180 and 180 degrees.`,
      };
    }

    const isWithinAP =
      point.latitude >= ANDHRA_PRADESH_BOUNDS.minLatitude &&
      point.latitude <= ANDHRA_PRADESH_BOUNDS.maxLatitude &&
      point.longitude >= ANDHRA_PRADESH_BOUNDS.minLongitude &&
      point.longitude <= ANDHRA_PRADESH_BOUNDS.maxLongitude;

    return {
      isValid: true,
      latitude: point.latitude,
      longitude: point.longitude,
      isWithinAndhraPradesh: isWithinAP,
      rejectionReason: isWithinAP
        ? null
        : 'Coordinates fall outside the Andhra Pradesh geographic boundary envelope.',
    };
  }

  /**
   * Provides address autocompletion suggestions matching user queries against AP landmarks.
   */
  async suggestAddresses(query: string, city?: string, limit = 5): Promise<AddressSuggestion[]> {
    await this.applySimulationFaults();

    const normalizedQuery = (query || '').toLowerCase().trim();
    if (!normalizedQuery) {
      return [];
    }

    const cityFilter = city ? city.toLowerCase().trim() : null;

    const matches = this.knownLandmarks.filter((item) => {
      if (cityFilter && item.city.toLowerCase() !== cityFilter) {
        return false;
      }
      return (
        item.primaryText.toLowerCase().includes(normalizedQuery) ||
        item.secondaryText.toLowerCase().includes(normalizedQuery) ||
        item.fullAddress.toLowerCase().includes(normalizedQuery) ||
        item.city.toLowerCase().includes(normalizedQuery) ||
        item.district.toLowerCase().includes(normalizedQuery)
      );
    });

    const suggestions = matches.slice(0, Math.min(limit, 20)).map((item) => ({
      id: item.id,
      placeId: `place_${item.id}`,
      primaryText: item.primaryText,
      secondaryText: item.secondaryText,
      fullAddress: item.fullAddress,
      city: item.city,
      district: item.district,
      coordinates: item.point,
    }));

    return suggestions;
  }

  /**
   * Calculates spherical distance, urban driving duration, and EV energy consumption
   * using zero billable external API calls.
   */
  async calculateDistanceMatrix(
    origin: GeoPoint,
    destination: GeoPoint,
  ): Promise<DistanceMatrixResult> {
    await this.applySimulationFaults();

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
    await this.applySimulationFaults();

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
    const details = await this.reverseGeocodeDetails(point);
    return details.fullAddress;
  }

  /**
   * Detailed reverse geocoding returning structured address, city, district, and coordinates.
   */
  async reverseGeocodeDetails(point: GeoPoint): Promise<ReverseGeocodeResponse> {
    await this.applySimulationFaults();

    const validation = this.validateCoordinates(point);
    if (!validation.isValid) {
      throw new Error(
        validation.rejectionReason || 'Invalid coordinates provided for reverse geocoding.',
      );
    }

    // Check nearest known landmark
    for (const landmark of this.knownLandmarks) {
      const distKm = this.calculateHaversineDistance(point, landmark.point) / 1000;
      if (distKm <= landmark.radiusKm) {
        return {
          fullAddress: `${landmark.name} (~${Math.round(distKm * 1000)}m)`,
          primaryName: landmark.primaryText,
          city: landmark.city,
          district: landmark.district,
          state: 'Andhra Pradesh',
          postalCode: landmark.postalCode,
          coordinates: point,
          isWithinAndhraPradesh: true,
          isFallback: false,
        };
      }
    }

    // Generic AP coordinate representation if inside boundary
    const isWithinAP = validation.isWithinAndhraPradesh;
    return {
      fullAddress: `AP Urban Point (${point.latitude.toFixed(4)}°N, ${point.longitude.toFixed(4)}°E)`,
      primaryName: `AP Point (${point.latitude.toFixed(2)}, ${point.longitude.toFixed(2)})`,
      city: isWithinAP ? 'visakhapatnam' : 'unknown',
      district: isWithinAP ? 'Visakhapatnam' : undefined,
      state: isWithinAP ? 'Andhra Pradesh' : 'Unknown',
      coordinates: point,
      isWithinAndhraPradesh: isWithinAP,
      isFallback: true,
    };
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

  calculateHaversineDistance(p1: GeoPoint, p2: GeoPoint): number {
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
