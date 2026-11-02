import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ProviderSimulationMode } from '@ecoride/contracts';

describe('Maps, Geocoding & Route Engine E2E (EV-032)', () => {
  jest.setTimeout(35000);

  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health', 'health/(.*)', 'metrics'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  }, 35000);

  afterAll(async () => {
    // Reset simulation mode to NORMAL and clear cache
    if (app) {
      await request(app.getHttpServer())
        .post('/v1/maps/simulate')
        .send({ simulationMode: ProviderSimulationMode.NORMAL });
      await request(app.getHttpServer()).post('/v1/maps/cache/clear');
      await app.close();
    }
  }, 35000);

  beforeEach(async () => {
    // Ensure clean simulation mode before each test
    await request(app.getHttpServer())
      .post('/v1/maps/simulate')
      .send({ simulationMode: ProviderSimulationMode.NORMAL });
    await request(app.getHttpServer()).post('/v1/maps/cache/clear');
  });

  describe('1. Coordinate Validation (POST /v1/maps/validate-coordinates)', () => {
    it('should validate valid coordinates within Andhra Pradesh', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/maps/validate-coordinates')
        .send({ latitude: 17.7142, longitude: 83.3235 })
        .expect(200);

      expect(res.body.isValid).toBe(true);
      expect(res.body.isWithinAndhraPradesh).toBe(true);
      expect(res.body.rejectionReason).toBeNull();
    });

    it('should flag coordinates outside Andhra Pradesh territory', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/maps/validate-coordinates')
        .send({ latitude: 28.6139, longitude: 77.209 }) // New Delhi
        .expect(200);

      expect(res.body.isValid).toBe(true);
      expect(res.body.isWithinAndhraPradesh).toBe(false);
      expect(res.body.rejectionReason).toContain('outside the Andhra Pradesh geographic boundary');
    });

    it('should reject coordinates exceeding mathematical latitude limits', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/maps/validate-coordinates')
        .send({ latitude: 95.0, longitude: 83.3 })
        .expect(200);

      expect(res.body.isValid).toBe(false);
      expect(res.body.rejectionReason).toContain('between -90 and 90');
    });
  });

  describe('2. Address Autocompletion Suggestions (GET /v1/maps/suggestions)', () => {
    it('should return autocompletion suggestions matching AP landmarks', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/maps/suggestions?query=rk%20beach')
        .expect(200);

      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body.suggestions.length).toBeGreaterThan(0);
      expect(res.body.suggestions[0].primaryText).toBe('RK Beach');
      expect(res.body.suggestions[0].city).toBe('visakhapatnam');
      expect(res.body.suggestions[0].coordinates.latitude).toBeCloseTo(17.7142, 2);
      expect(res.body.isFallback).toBe(false);
    });

    it('should filter suggestions by municipal city code', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/maps/suggestions?query=Benz&city=vijayawada')
        .expect(200);

      expect(res.body.suggestions.length).toBeGreaterThan(0);
      expect(res.body.suggestions[0].primaryText).toContain('Benz Circle');
      expect(res.body.suggestions[0].city).toBe('vijayawada');
    });

    it('should return empty list for whitespace-only query without error', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/maps/suggestions?query=%20%20%20')
        .expect(200);

      expect(res.body.suggestions).toEqual([]);
      expect(res.body.totalFound).toBe(0);
    });
  });

  describe('3. Reverse Geocoding (POST /v1/maps/reverse-geocode)', () => {
    it('should reverse geocode coordinates near Visakhapatnam RTC complex', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/maps/reverse-geocode')
        .send({ latitude: 17.7275, longitude: 83.3038 })
        .expect(200);

      expect(res.body.primaryName).toContain('Dwaraka Nagar RTC');
      expect(res.body.city).toBe('visakhapatnam');
      expect(res.body.state).toBe('Andhra Pradesh');
      expect(res.body.isWithinAndhraPradesh).toBe(true);
      expect(res.body.isFallback).toBe(false);
    });

    it('should reject invalid coordinates with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/v1/maps/reverse-geocode')
        .send({ latitude: 195.0, longitude: 83.0 }) // Lat > 90
        .expect(400);
    });
  });

  describe('4. Route Calculation (POST /v1/maps/route)', () => {
    it('should calculate realistic distance, duration, ETA, and EV battery consumption', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/maps/route')
        .send({
          origin: { latitude: 17.7275, longitude: 83.3038 }, // Dwaraka Nagar RTC
          destination: { latitude: 17.7142, longitude: 83.3235 }, // RK Beach
          serviceCategory: 'CITY_COMMUTE_2W',
        })
        .expect(200);

      expect(res.body.distanceMeters).toBeGreaterThan(2000);
      expect(res.body.durationSeconds).toBeGreaterThan(120);
      expect(res.body.etaMinutes).toBeGreaterThanOrEqual(2);
      expect(new Date(res.body.etaTimestamp).getTime()).toBeGreaterThan(Date.now());
      expect(res.body.encodedPolyline).toContain('mock_poly_');
      expect(res.body.polylinePoints.length).toBeGreaterThan(0);
      expect(res.body.estimatedEnergyKwh).toBeGreaterThan(0.1);
      expect(res.body.isFallback).toBe(false);
    });

    it('should reject invalid destination coordinates with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/v1/maps/route')
        .send({
          origin: { latitude: 17.7, longitude: 83.3 },
          destination: { latitude: 105.0, longitude: 83.3 }, // Lat > 90
        })
        .expect(400);
    });
  });

  describe('5. Acceptance: Timeout & Downtime Fault Simulation Without Trapping the User', () => {
    it('ACCEPTANCE: should simulate upstream TIMEOUT and return fallback route without hanging', async () => {
      // 1. Inject TIMEOUT fault mode with 3000ms delay (> 2500ms timeout limit)
      await request(app.getHttpServer())
        .post('/v1/maps/simulate')
        .send({ simulationMode: ProviderSimulationMode.TIMEOUT, delayMs: 3000 })
        .expect(200);

      const startTime = Date.now();

      // 2. Client calls route calculation
      const res = await request(app.getHttpServer())
        .post('/v1/maps/route')
        .send({
          origin: { latitude: 17.7275, longitude: 83.3038 },
          destination: { latitude: 17.7142, longitude: 83.3235 },
        })
        .expect(200);

      const elapsed = Date.now() - startTime;

      // 3. User is NOT trapped in loading state; request returns within bounded deadline
      expect(elapsed).toBeLessThan(12000);
      expect(res.body.isFallback).toBe(true);
      expect(res.body.warning).toContain('Maps provider degraded');
      expect(res.body.distanceMeters).toBeGreaterThan(1000);
      expect(res.body.etaMinutes).toBeGreaterThan(0);
      expect(res.body.encodedPolyline).toContain('offline_poly_');
    }, 15000);

    it('ACCEPTANCE: should simulate upstream TIMEOUT on reverse geocoding and return fallback landmark', async () => {
      await request(app.getHttpServer())
        .post('/v1/maps/simulate')
        .send({ simulationMode: ProviderSimulationMode.TIMEOUT, delayMs: 3000 })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/v1/maps/reverse-geocode')
        .send({ latitude: 17.7142, longitude: 83.3235 })
        .expect(200);

      expect(res.body.isFallback).toBe(true);
      expect(res.body.fullAddress).toContain('AP Location');
      expect(res.body.warning).toContain('Maps provider degraded');
    }, 15000);

    it('ACCEPTANCE: should simulate upstream DOWNTIME (500 Error) and return fallback data without crash', async () => {
      // 1. Inject DOWNTIME mode
      await request(app.getHttpServer())
        .post('/v1/maps/simulate')
        .send({ simulationMode: ProviderSimulationMode.DOWNTIME })
        .expect(200);

      // 2. Route calculation gracefully falls back
      const routeRes = await request(app.getHttpServer())
        .post('/v1/maps/route')
        .send({
          origin: { latitude: 16.4975, longitude: 80.6558 },
          destination: { latitude: 16.5085, longitude: 80.6178 },
        })
        .expect(200);

      expect(routeRes.body.isFallback).toBe(true);
      expect(routeRes.body.warning).toContain('500 Internal Server Error');
      expect(routeRes.body.distanceMeters).toBeGreaterThan(500);

      // 3. Address suggestions gracefully fall back to local landmarks
      const sugRes = await request(app.getHttpServer())
        .get('/v1/maps/suggestions?query=Beach')
        .expect(200);

      expect(sugRes.body.isFallback).toBe(true);
      expect(sugRes.body.suggestions.length).toBeGreaterThan(0);
      expect(sugRes.body.suggestions[0].primaryText).toBe('RK Beach');
    });
  });

  describe('6. Provider Status & Cache Management (GET /status, POST /cache/clear)', () => {
    it('should return provider health, cache entries, and simulation status', async () => {
      const res = await request(app.getHttpServer()).get('/v1/maps/status').expect(200);

      expect(res.body.providerName).toContain('MockMapsProvider');
      expect(res.body.isHealthy).toBe(true);
      expect(res.body.maxCacheSize).toBe(500);
      expect(res.body.activeSimulationMode).toBe(ProviderSimulationMode.NORMAL);
      expect(res.body.timeoutMs).toBe(2500);
    });

    it('should clear in-memory cache and reset metrics', async () => {
      // Generate cache entry
      await request(app.getHttpServer()).get('/v1/maps/suggestions?query=RK%20Beach');

      const clearRes = await request(app.getHttpServer()).post('/v1/maps/cache/clear').expect(200);

      expect(clearRes.body.status.cacheEntriesCount).toBe(0);
      expect(clearRes.body.status.cacheHitsCount).toBe(0);
    });
  });
});
