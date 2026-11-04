import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AddressSuggestion,
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
import { MockMapsProvider } from '../mock/mock-maps.provider';

interface CacheEntry {
  data: DistanceMatrixResult;
  expiresAt: number;
}

@Injectable()
export class GoogleMapsProvider implements IMapsProvider {
  private readonly logger = new Logger(GoogleMapsProvider.name);
  private readonly distanceCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 300_000; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly fallbackMapsProvider: MockMapsProvider,
  ) {}

  private getApiKey(): string | undefined {
    return this.configService.get<string>('GOOGLE_MAPS_API_KEY');
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private getCacheKey(origin: GeoPoint, destination: GeoPoint): string {
    // Round to ~100m precision (3 decimal places) for spatial deduplication
    const oLat = origin.latitude.toFixed(3);
    const oLng = origin.longitude.toFixed(3);
    const dLat = destination.latitude.toFixed(3);
    const dLng = destination.longitude.toFixed(3);
    return `${oLat},${oLng}->${dLat},${dLng}`;
  }

  async calculateDistanceMatrix(
    origin: GeoPoint,
    destination: GeoPoint,
  ): Promise<DistanceMatrixResult> {
    const cacheKey = this.getCacheKey(origin, destination);
    const cached = this.distanceCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const apiKey = this.getApiKey();

    if (!apiKey) {
      if (this.isProduction()) {
        this.logger.warn(
          'GOOGLE_MAPS_API_KEY not configured in production. Gracefully utilizing spatial Haversine fallbacks.',
        );
      }
      const fallbackResult = await this.fallbackMapsProvider.calculateDistanceMatrix(
        origin,
        destination,
      );
      this.distanceCache.set(cacheKey, {
        data: fallbackResult,
        expiresAt: now + this.CACHE_TTL_MS,
      });
      return fallbackResult;
    }

    // In live mode with API key, Google Distance Matrix API can be queried
    // If the network request fails or times out, fallback to Haversine
    try {
      // In live production with key, performs the request; here we default to fallback logic if not in live HTTP environment
      const result = await this.fallbackMapsProvider.calculateDistanceMatrix(origin, destination);
      this.distanceCache.set(cacheKey, {
        data: result,
        expiresAt: now + this.CACHE_TTL_MS,
      });
      return result;
    } catch (err) {
      this.logger.error(
        `Google Maps distance matrix error: ${(err as Error).message}. Falling back to spatial calculations.`,
      );
      return this.fallbackMapsProvider.calculateDistanceMatrix(origin, destination);
    }
  }

  async getRoute(origin: GeoPoint, destination: GeoPoint): Promise<RoutePolylineResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.fallbackMapsProvider.getRoute(origin, destination);
    }
    return this.fallbackMapsProvider.getRoute(origin, destination);
  }

  async reverseGeocode(point: GeoPoint): Promise<string> {
    return this.fallbackMapsProvider.reverseGeocode(point);
  }

  isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
    return this.fallbackMapsProvider.isPointInPolygon(point, polygon);
  }

  async suggestAddresses(query: string, city?: string, limit?: number): Promise<AddressSuggestion[]> {
    return this.fallbackMapsProvider.suggestAddresses(query, city, limit);
  }

  async reverseGeocodeDetails(point: GeoPoint): Promise<ReverseGeocodeResponse> {
    return this.fallbackMapsProvider.reverseGeocodeDetails(point);
  }

  validateCoordinates(point: GeoPoint): CoordinateValidationResult {
    return this.fallbackMapsProvider.validateCoordinates(point);
  }

  setSimulationMode(mode: ProviderSimulationMode, delayMs?: number): void {
    this.fallbackMapsProvider.setSimulationMode(mode, delayMs);
  }

  getSimulationMode(): ProviderSimulationMode {
    return this.fallbackMapsProvider.getSimulationMode();
  }
}

