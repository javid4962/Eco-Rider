import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import {
  AddressSuggestion,
  AddressSuggestionsResponse,
  ANDHRA_PRADESH_BOUNDS,
  CoordinateValidationResult,
  GeoPoint,
  MapProviderStatus,
  ProviderSimulationMode,
  ReverseGeocodeResponse,
  RouteCalculationResponse,
} from '@ecoride/contracts';
import { MAPS_PROVIDER } from '../providers/providers.constants';
import { IMapsProvider } from '../providers/interfaces/maps-provider.interface';
import {
  AddressSuggestionsQueryDto,
  ReverseGeocodeDto,
  RouteCalculationDto,
  ValidateCoordinatesDto,
} from './dto';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  // Resilience & Performance thresholds
  private readonly timeoutMs: number = 2500; // 2.5s provider timeout limit
  private readonly maxRetries: number = 2; // Maximum 2 retries for transient upstream failures
  private readonly initialBackoffMs: number = 50; // Initial retry backoff
  private readonly maxCacheEntries: number = 500; // Bounded LRU/FIFO cache size limit
  private readonly cacheTtlMs: number = 10 * 60 * 1000; // 10 minutes cache TTL

  // In-memory bounded cache
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private cacheHitsCount = 0;
  private cacheMissesCount = 0;

  constructor(
    @Inject(MAPS_PROVIDER)
    private readonly mapsProvider: IMapsProvider,
  ) {}

  /**
   * Validates GPS coordinate inputs for mathematical correctness and Andhra Pradesh boundary inclusion.
   */
  validateCoordinates(dto: ValidateCoordinatesDto): CoordinateValidationResult {
    return this.mapsProvider.validateCoordinates(dto);
  }

  /**
   * Asserts that coordinates are mathematically valid; throws BadRequestException if invalid.
   */
  assertCoordinatesValid(point: GeoPoint, fieldName = 'Coordinates'): CoordinateValidationResult {
    const result = this.validateCoordinates(point);
    if (!result.isValid) {
      throw new BadRequestException({
        code: 'INVALID_COORDINATES',
        message: `${fieldName}: ${result.rejectionReason}`,
        details: result,
      });
    }
    return result;
  }

  /**
   * Retrieves address autocompletion suggestions matching user query with caching and fallback.
   */
  async suggestAddresses(
    queryDto: AddressSuggestionsQueryDto,
  ): Promise<AddressSuggestionsResponse> {
    const query = (queryDto.query || '').trim();
    if (!query) {
      return {
        suggestions: [],
        query: '',
        city: queryDto.city,
        totalFound: 0,
        isFallback: false,
      };
    }

    const city = queryDto.city ? queryDto.city.toLowerCase().trim() : undefined;
    const limit = queryDto.limit || 5;
    const cacheKey = `sug:${city || 'all'}:${query.toLowerCase()}:${limit}`;

    const cached = this.getFromCache<AddressSuggestion[]>(cacheKey);
    if (cached) {
      return {
        suggestions: cached,
        query,
        city,
        totalFound: cached.length,
        isFallback: false,
      };
    }

    let isFallback = false;
    let suggestions: AddressSuggestion[] = [];

    try {
      suggestions = await this.executeWithResilience(
        () => this.mapsProvider.suggestAddresses(query, city, limit),
        'suggestAddresses',
      );
    } catch (err) {
      this.logger.warn(
        `suggestAddresses upstream failure: ${err instanceof Error ? err.message : String(err)}. Falling back to local offline search.`,
      );
      isFallback = true;
      suggestions = this.getOfflineSuggestions(query, city, limit);
    }

    if (!isFallback && suggestions.length > 0) {
      this.putIntoCache(cacheKey, suggestions);
    }

    return {
      suggestions,
      query,
      city,
      totalFound: suggestions.length,
      isFallback,
    };
  }

  /**
   * Reverse geocodes coordinates to street address or urban landmark.
   * Guarantees fast completion without trapping the user in an infinite loading state.
   */
  async reverseGeocode(dto: ReverseGeocodeDto): Promise<ReverseGeocodeResponse> {
    this.assertCoordinatesValid(dto, 'Reverse geocode coordinates');

    const cacheKey = `rg:${dto.latitude.toFixed(4)}:${dto.longitude.toFixed(4)}`;
    const cached = this.getFromCache<ReverseGeocodeResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    let result: ReverseGeocodeResponse;

    try {
      result = await this.executeWithResilience(
        () => this.mapsProvider.reverseGeocodeDetails(dto),
        'reverseGeocodeDetails',
      );
    } catch (err) {
      this.logger.warn(
        `reverseGeocodeDetails upstream failure: ${err instanceof Error ? err.message : String(err)}. Returning offline landmark approximation.`,
      );
      result = this.getOfflineReverseGeocode(dto, err instanceof Error ? err.message : String(err));
    }

    if (!result.isFallback) {
      this.putIntoCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Calculates route distance, duration, ETA, and EV energy consumption.
   * Employs timeout abort and offline geometric fallbacks to prevent hanging dispatch flows.
   */
  async calculateRoute(dto: RouteCalculationDto): Promise<RouteCalculationResponse> {
    this.assertCoordinatesValid(dto.origin, 'Origin coordinates');
    this.assertCoordinatesValid(dto.destination, 'Destination coordinates');

    const cacheKey = `rt:${dto.origin.latitude.toFixed(4)}:${dto.origin.longitude.toFixed(4)}:${dto.destination.latitude.toFixed(4)}:${dto.destination.longitude.toFixed(4)}:${dto.serviceCategory || 'default'}`;
    const cached = this.getFromCache<RouteCalculationResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    let result: RouteCalculationResponse;

    try {
      const routePolyline = await this.executeWithResilience(
        () => this.mapsProvider.getRoute(dto.origin, dto.destination),
        'getRoute',
      );

      const distanceMeters = routePolyline.distanceMeters;
      const durationSeconds = routePolyline.durationSeconds;
      const etaMinutes = Math.max(1, Math.round(durationSeconds / 60));
      const etaTimestamp = new Date(Date.now() + durationSeconds * 1000).toISOString();

      // Energy consumption: ~0.08 kWh/km for 2W/3W, ~0.14 kWh/km for 4W cabs/vans
      const km = distanceMeters / 1000;
      const is4W = dto.serviceCategory?.includes('4W') || dto.serviceCategory?.includes('CAB');
      const rateKwh = is4W ? 0.14 : 0.08;
      const estimatedEnergyKwh = Math.round(km * rateKwh * 100) / 100;

      result = {
        distanceMeters,
        durationSeconds,
        etaMinutes,
        etaTimestamp,
        encodedPolyline: routePolyline.encodedPolyline,
        polylinePoints: routePolyline.points,
        estimatedEnergyKwh,
        isFallback: false,
        computedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.warn(
        `calculateRoute upstream failure: ${err instanceof Error ? err.message : String(err)}. Activating offline geometric calculation.`,
      );
      result = this.getOfflineRouteCalculation(
        dto,
        err instanceof Error ? err.message : String(err),
      );
    }

    if (!result.isFallback) {
      this.putIntoCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Wraps an asynchronous provider operation with strict timeout protection and bounded exponential retries.
   * Ensures requests NEVER hang indefinitely or trap clients in loading states.
   */
  private async executeWithResilience<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoff = this.initialBackoffMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }

        // Enforce strict timeout limit
        return await this.withTimeout(operation(), this.timeoutMs, operationName);
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `Maps provider operation '${operationName}' attempt ${attempt + 1}/${this.maxRetries + 1} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    throw lastError;
  }

  /**
   * Races a promise against a timeout deadline.
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string,
  ): Promise<T> {
    let timerId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        reject(
          new Error(
            `Maps provider operation '${operationName}' timed out after ${timeoutMs}ms limit.`,
          ),
        );
      }, timeoutMs);
      if (typeof timerId === 'object' && typeof (timerId as NodeJS.Timeout).unref === 'function') {
        (timerId as NodeJS.Timeout).unref();
      }
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timerId) clearTimeout(timerId);
    }
  }

  /**
   * Offline fallback for address suggestions during provider outages.
   */
  private getOfflineSuggestions(query: string, city?: string, limit = 5): AddressSuggestion[] {
    const fallbackLandmarks: AddressSuggestion[] = [
      {
        id: 'fb-vzg-001',
        placeId: 'place_fb_vzg_001',
        primaryText: 'RK Beach',
        secondaryText: 'Visakhapatnam, Andhra Pradesh',
        fullAddress: 'RK Beach, Beach Road, Visakhapatnam, Andhra Pradesh 530002',
        city: 'visakhapatnam',
        coordinates: { latitude: 17.7142, longitude: 83.3235 },
      },
      {
        id: 'fb-vzg-002',
        placeId: 'place_fb_vzg_002',
        primaryText: 'Dwaraka Nagar RTC Complex',
        secondaryText: 'Visakhapatnam, Andhra Pradesh',
        fullAddress: 'Dwaraka Bus Station, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016',
        city: 'visakhapatnam',
        coordinates: { latitude: 17.7275, longitude: 83.3038 },
      },
      {
        id: 'fb-vja-001',
        placeId: 'place_fb_vja_001',
        primaryText: 'Benz Circle',
        secondaryText: 'Vijayawada, Andhra Pradesh',
        fullAddress: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
        city: 'vijayawada',
        coordinates: { latitude: 16.4975, longitude: 80.6558 },
      },
    ];

    const q = query.toLowerCase();
    const filtered = fallbackLandmarks.filter((item) => {
      if (city && item.city !== city.toLowerCase()) return false;
      return (
        item.primaryText.toLowerCase().includes(q) || item.fullAddress.toLowerCase().includes(q)
      );
    });

    return filtered.slice(0, limit);
  }

  /**
   * Offline fallback for reverse geocoding during provider downtime or timeouts.
   */
  private getOfflineReverseGeocode(point: GeoPoint, errorReason: string): ReverseGeocodeResponse {
    const isWithinAP =
      point.latitude >= ANDHRA_PRADESH_BOUNDS.minLatitude &&
      point.latitude <= ANDHRA_PRADESH_BOUNDS.maxLatitude &&
      point.longitude >= ANDHRA_PRADESH_BOUNDS.minLongitude &&
      point.longitude <= ANDHRA_PRADESH_BOUNDS.maxLongitude;

    return {
      fullAddress: `AP Location (${point.latitude.toFixed(4)}°N, ${point.longitude.toFixed(4)}°E)`,
      primaryName: `AP Point (${point.latitude.toFixed(2)}, ${point.longitude.toFixed(2)})`,
      city: isWithinAP ? 'visakhapatnam' : 'unknown',
      state: isWithinAP ? 'Andhra Pradesh' : 'Unknown',
      coordinates: point,
      isWithinAndhraPradesh: isWithinAP,
      isFallback: true,
      warning: `Maps provider degraded (${errorReason}); returned offline coordinate approximation.`,
    };
  }

  /**
   * Offline fallback for route calculation during provider downtime or timeouts.
   */
  private getOfflineRouteCalculation(
    dto: RouteCalculationDto,
    errorReason: string,
  ): RouteCalculationResponse {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(dto.destination.latitude - dto.origin.latitude);
    const dLon = toRad(dto.destination.longitude - dto.origin.longitude);
    const lat1 = toRad(dto.origin.latitude);
    const lat2 = toRad(dto.destination.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineMeters = Math.round(R * c);

    // Road winding factor: 1.25x
    const distanceMeters = Math.max(500, Math.round(straightLineMeters * 1.25));
    // Urban speed ~28 km/h = 7.78 m/s
    const durationSeconds = Math.max(120, Math.round(distanceMeters / 7.78));
    const etaMinutes = Math.max(2, Math.round(durationSeconds / 60));
    const etaTimestamp = new Date(Date.now() + durationSeconds * 1000).toISOString();

    const km = distanceMeters / 1000;
    const is4W = dto.serviceCategory?.includes('4W') || dto.serviceCategory?.includes('CAB');
    const rateKwh = is4W ? 0.14 : 0.08;
    const estimatedEnergyKwh = Math.round(km * rateKwh * 100) / 100;

    // Generate 5 synthetic steps
    const polylinePoints: GeoPoint[] = [];
    for (let i = 0; i <= 5; i++) {
      const frac = i / 5;
      polylinePoints.push({
        latitude:
          Math.round(
            (dto.origin.latitude + (dto.destination.latitude - dto.origin.latitude) * frac) * 1e6,
          ) / 1e6,
        longitude:
          Math.round(
            (dto.origin.longitude + (dto.destination.longitude - dto.origin.longitude) * frac) *
              1e6,
          ) / 1e6,
      });
    }

    return {
      distanceMeters,
      durationSeconds,
      etaMinutes,
      etaTimestamp,
      encodedPolyline: `offline_poly_${Math.round(dto.origin.latitude * 100)}_${Math.round(dto.destination.latitude * 100)}`,
      polylinePoints,
      estimatedEnergyKwh,
      isFallback: true,
      computedAt: new Date().toISOString(),
      warning: `Maps provider degraded (${errorReason}); returned offline geometric route approximation.`,
    };
  }

  // --- Caching Utilities ---

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.cacheMissesCount++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.cacheMissesCount++;
      return null;
    }

    this.cacheHitsCount++;
    return entry.data;
  }

  private putIntoCache<T>(key: string, data: T): void {
    if (this.cache.size >= this.maxCacheEntries) {
      // FIFO eviction of the oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  /**
   * Returns provider health, cache statistics, and active simulation mode.
   */
  getStatus(): MapProviderStatus {
    const totalRequests = this.cacheHitsCount + this.cacheMissesCount;
    const cacheHitRatio =
      totalRequests > 0 ? Math.round((this.cacheHitsCount / totalRequests) * 100) / 100 : 0;

    return {
      providerName: 'MockMapsProvider (Andhra Pradesh Urban Engine)',
      isHealthy: this.mapsProvider.getSimulationMode() !== ProviderSimulationMode.DOWNTIME,
      cacheEntriesCount: this.cache.size,
      maxCacheSize: this.maxCacheEntries,
      cacheHitsCount: this.cacheHitsCount,
      cacheMissesCount: this.cacheMissesCount,
      cacheHitRatio,
      activeSimulationMode: this.mapsProvider.getSimulationMode(),
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
    };
  }

  /**
   * Sets simulation fault injection mode for testing resilience.
   */
  setSimulationMode(mode: ProviderSimulationMode, delayMs = 0): void {
    this.mapsProvider.setSimulationMode(mode, delayMs);
  }

  /**
   * Clears the in-memory cache and resets hit counters.
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHitsCount = 0;
    this.cacheMissesCount = 0;
    this.logger.log('Maps cache cleared.');
  }
}
