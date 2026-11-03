import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MapsService } from '../src/modules/maps/maps.service';
import { MockMapsProvider } from '../src/modules/providers/mock/mock-maps.provider';
import { MAPS_PROVIDER } from '../src/modules/providers/providers.constants';
import { ProviderSimulationMode } from '@ecoride/contracts';

describe('Maps, Geocoding & Route Provider Abstraction (EV-032)', () => {
  let service: MapsService;
  let mockProvider: MockMapsProvider;

  beforeEach(async () => {
    mockProvider = new MockMapsProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapsService,
        {
          provide: MAPS_PROVIDER,
          useValue: mockProvider,
        },
      ],
    }).compile();

    service = module.get<MapsService>(MapsService);
    mockProvider.setSimulationMode(ProviderSimulationMode.NORMAL);
  });

  afterEach(() => {
    mockProvider.setSimulationMode(ProviderSimulationMode.NORMAL);
    service.clearCache();
  });

  describe('1. Coordinate Validation & AP Territorial Inclusion', () => {
    it('should validate valid coordinates within Andhra Pradesh', () => {
      // RK Beach, Visakhapatnam
      const rkBeach = { latitude: 17.7142, longitude: 83.3235 };
      const result = service.validateCoordinates(rkBeach);

      expect(result.isValid).toBe(true);
      expect(result.isWithinAndhraPradesh).toBe(true);
      expect(result.rejectionReason).toBeNull();
    });

    it('should validate coordinates outside Andhra Pradesh but within Earth bounds', () => {
      // New Delhi
      const newDelhi = { latitude: 28.6139, longitude: 77.209 };
      const result = service.validateCoordinates(newDelhi);

      expect(result.isValid).toBe(true);
      expect(result.isWithinAndhraPradesh).toBe(false);
      expect(result.rejectionReason).toContain('outside the Andhra Pradesh geographic boundary');
    });

    it('should reject invalid latitude (> 90 or < -90 degrees)', () => {
      const invalidLat = { latitude: 95.5, longitude: 83.3 };
      const result = service.validateCoordinates(invalidLat);

      expect(result.isValid).toBe(false);
      expect(result.rejectionReason).toContain('between -90 and 90');
    });

    it('should reject invalid longitude (> 180 or < -180 degrees)', () => {
      const invalidLng = { latitude: 17.7, longitude: 185.0 };
      const result = service.validateCoordinates(invalidLng);

      expect(result.isValid).toBe(false);
      expect(result.rejectionReason).toContain('between -180 and 180');
    });

    it('should reject NaN or Infinite coordinates', () => {
      const nanPoint = { latitude: NaN, longitude: 83.3 };
      const result = service.validateCoordinates(nanPoint);

      expect(result.isValid).toBe(false);
      expect(result.rejectionReason).toContain('valid finite numbers');
    });

    it('should throw BadRequestException when assertCoordinatesValid fails', () => {
      expect(() => {
        service.assertCoordinatesValid({ latitude: 105.0, longitude: 83.0 }, 'Pickup');
      }).toThrow(BadRequestException);
    });
  });

  describe('2. Address Autocompletion Suggestions', () => {
    it('should return matching suggestions for AP landmarks', async () => {
      const result = await service.suggestAddresses({ query: 'rk beach' });

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].primaryText).toBe('RK Beach');
      expect(result.suggestions[0].city).toBe('visakhapatnam');
      expect(result.suggestions[0].coordinates.latitude).toBeCloseTo(17.7142, 2);
      expect(result.isFallback).toBe(false);
    });

    it('should filter suggestions by municipal city code', async () => {
      const result = await service.suggestAddresses({
        query: 'Benz',
        city: 'vijayawada',
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].primaryText).toContain('Benz Circle');
      expect(result.suggestions[0].city).toBe('vijayawada');
    });

    it('should respect suggestion limit parameter', async () => {
      const result = await service.suggestAddresses({ query: 'Visakhapatnam', limit: 2 });

      expect(result.suggestions.length).toBeLessThanOrEqual(2);
    });

    it('should return empty suggestions for blank query without calling provider', async () => {
      const result = await service.suggestAddresses({ query: '   ' });

      expect(result.suggestions).toEqual([]);
      expect(result.totalFound).toBe(0);
    });
  });

  describe('3. Reverse Geocoding', () => {
    it('should reverse geocode coordinates near known AP landmark', async () => {
      // Near Dwaraka Nagar RTC Complex, Vizag
      const point = { latitude: 17.7275, longitude: 83.3038 };
      const result = await service.reverseGeocode(point);

      expect(result.primaryName).toContain('Dwaraka Nagar RTC');
      expect(result.city).toBe('visakhapatnam');
      expect(result.state).toBe('Andhra Pradesh');
      expect(result.isWithinAndhraPradesh).toBe(true);
      expect(result.isFallback).toBe(false);
    });

    it('should return generic AP urban point format for coordinates away from known landmarks', async () => {
      const point = { latitude: 17.5, longitude: 82.8 }; // Rural Vizag district within AP bounds
      const result = await service.reverseGeocode(point);

      expect(result.fullAddress).toContain('AP Urban Point');
      expect(result.isWithinAndhraPradesh).toBe(true);
    });

    it('should reject invalid coordinates on reverse geocoding', async () => {
      await expect(service.reverseGeocode({ latitude: 195.0, longitude: 83.0 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('4. Route Distance, ETA & EV Energy Calculation', () => {
    it('should calculate realistic distance, duration, ETA, and EV battery consumption', async () => {
      // Dwaraka Nagar RTC Complex -> RK Beach (Visakhapatnam)
      const origin = { latitude: 17.7275, longitude: 83.3038 };
      const destination = { latitude: 17.7142, longitude: 83.3235 };

      const result = await service.calculateRoute({
        origin,
        destination,
        serviceCategory: 'CITY_COMMUTE_2W',
      });

      expect(result.distanceMeters).toBeGreaterThan(2000);
      expect(result.durationSeconds).toBeGreaterThan(120);
      expect(result.etaMinutes).toBeGreaterThanOrEqual(2);
      expect(new Date(result.etaTimestamp).getTime()).toBeGreaterThan(Date.now());
      expect(result.encodedPolyline).toContain('mock_poly_');
      expect(result.polylinePoints.length).toBeGreaterThan(0);
      expect(result.estimatedEnergyKwh).toBeGreaterThan(0.1);
      expect(result.isFallback).toBe(false);
    });

    it('should estimate higher EV energy consumption for 4W cabs than 2W bike taxis', async () => {
      const origin = { latitude: 17.7275, longitude: 83.3038 };
      const destination = { latitude: 17.7818, longitude: 83.3776 }; // ~8 km trip

      const bikeRoute = await service.calculateRoute({
        origin,
        destination,
        serviceCategory: 'CITY_COMMUTE_2W',
      });

      service.clearCache(); // Clear cache to recalculate with different category

      const cabRoute = await service.calculateRoute({
        origin,
        destination,
        serviceCategory: 'CAB_PRIVATE_4W',
      });

      expect(cabRoute.estimatedEnergyKwh).toBeGreaterThan(bikeRoute.estimatedEnergyKwh);
    });

    it('should reject route calculation with invalid origin or destination coordinates', async () => {
      await expect(
        service.calculateRoute({
          origin: { latitude: 99.0, longitude: 83.0 },
          destination: { latitude: 17.7, longitude: 83.3 },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Acceptance Demonstration: Timeout Simulation Without Trapping the User', () => {
    it('should simulate upstream provider TIMEOUT and return deterministic fallback route without hanging', async () => {
      // Inject timeout fault simulation mode
      mockProvider.setSimulationMode(ProviderSimulationMode.TIMEOUT, 3000);

      const origin = { latitude: 17.7275, longitude: 83.3038 };
      const destination = { latitude: 17.7142, longitude: 83.3235 };

      const startTime = Date.now();
      const result = await service.calculateRoute({ origin, destination });
      const elapsed = Date.now() - startTime;

      // Assert that request completed and did NOT hang indefinitely
      expect(elapsed).toBeLessThan(12000);
      expect(result).toBeDefined();
      expect(result.isFallback).toBe(true);
      expect(result.warning).toContain('Maps provider degraded');
      expect(result.distanceMeters).toBeGreaterThan(1000);
      expect(result.etaMinutes).toBeGreaterThan(0);
      expect(result.polylinePoints.length).toBe(6);
      expect(result.encodedPolyline).toContain('offline_poly_');
    }, 30000);

    it('should simulate upstream provider TIMEOUT on reverse geocode and return fallback approximation', async () => {
      mockProvider.setSimulationMode(ProviderSimulationMode.TIMEOUT, 3000);

      const point = { latitude: 17.7142, longitude: 83.3235 };
      const result = await service.reverseGeocode(point);

      expect(result.isFallback).toBe(true);
      expect(result.fullAddress).toContain('AP Location');
      expect(result.warning).toContain('Maps provider degraded');
    }, 30000);
  });

  describe('6. Acceptance Demonstration: Provider Downtime (500 Error / Outage) Resilience', () => {
    it('should handle provider DOWNTIME on route calculation without unhandled crash', async () => {
      // Upstream gateway down (500 Internal Server Error)
      mockProvider.setSimulationMode(ProviderSimulationMode.DOWNTIME);

      const origin = { latitude: 16.4975, longitude: 80.6558 };
      const destination = { latitude: 16.5085, longitude: 80.6178 };

      const result = await service.calculateRoute({ origin, destination });

      expect(result).toBeDefined();
      expect(result.isFallback).toBe(true);
      expect(result.warning).toContain('500 Internal Server Error');
      expect(result.distanceMeters).toBeGreaterThan(500);
    });

    it('should handle provider DOWNTIME on address suggestions by serving offline landmarks', async () => {
      mockProvider.setSimulationMode(ProviderSimulationMode.DOWNTIME);

      const result = await service.suggestAddresses({ query: 'Beach' });

      expect(result.isFallback).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].primaryText).toBe('RK Beach');
    });
  });

  describe('7. Bounded Caching Limits & Performance Eviction', () => {
    it('should cache route calculation results and increment cache hit count', async () => {
      const origin = { latitude: 17.7275, longitude: 83.3038 };
      const destination = { latitude: 17.7142, longitude: 83.3235 };

      // Request 1: Cache Miss
      const res1 = await service.calculateRoute({ origin, destination });
      const status1 = service.getStatus();
      expect(status1.cacheHitsCount).toBe(0);
      expect(status1.cacheMissesCount).toBe(1);

      // Request 2: Cache Hit
      const res2 = await service.calculateRoute({ origin, destination });
      const status2 = service.getStatus();
      expect(status2.cacheHitsCount).toBe(1);
      expect(res2.distanceMeters).toBe(res1.distanceMeters);
    });

    it('should clear cache and reset metrics via clearCache', async () => {
      await service.suggestAddresses({ query: 'RK Beach' });
      expect(service.getStatus().cacheEntriesCount).toBeGreaterThan(0);

      service.clearCache();
      const status = service.getStatus();
      expect(status.cacheEntriesCount).toBe(0);
      expect(status.cacheHitsCount).toBe(0);
      expect(status.cacheMissesCount).toBe(0);
    });
  });
});
