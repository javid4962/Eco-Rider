import { HealthService } from '../src/modules/health/health.service';
import { MetricsService } from '../src/modules/health/metrics.service';
import { LogSanitizer } from '../src/common/logging/log-sanitizer';
import { DataSource } from 'typeorm';
import { RedisService } from '../src/modules/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../src/config/configuration';

describe('App & API Diagnostics (EV-014 Unit Tests)', () => {
  describe('HealthService: Liveness vs Readiness Isolation', () => {
    let healthService: HealthService;
    let mockDataSource: { isInitialized: boolean; query: jest.Mock };
    let mockRedisService: { ping: jest.Mock };
    let mockConfigService: { get: jest.Mock };

    beforeEach(() => {
      mockDataSource = {
        isInitialized: true,
        query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      };
      mockRedisService = {
        ping: jest.fn().mockResolvedValue(true),
      };
      mockConfigService = {
        get: jest.fn().mockReturnValue('ecoride-api'),
      };

      healthService = new HealthService(
        mockDataSource as unknown as DataSource,
        mockRedisService as unknown as RedisService,
        mockConfigService as unknown as ConfigService<AppConfig, true>,
      );
    });

    it('should return LIVENESS ok with uptime and memory metrics', async () => {
      const liveness = await healthService.checkLiveness();

      expect(liveness.status).toBe('ok');
      expect(liveness.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(liveness.memory.heapUsedMb).toBeGreaterThan(0);
      expect(liveness.memory.rssMb).toBeGreaterThan(0);
    });

    it('should return READINESS ok when both database and redis are operational', async () => {
      const readiness = await healthService.checkReadiness();

      expect(readiness.ready).toBe(true);
      expect(readiness.status).toBe('ok');
      expect(readiness.dependencies.database.status).toBe('up');
      expect(readiness.dependencies.redis.status).toBe('up');
      expect(readiness.dependencies.database.latencyMs).toBeDefined();
    });

    it('CRITICAL ACCEPTANCE: a down database makes readiness fail (status: not_ready) while liveness stays meaningful', async () => {
      // 1. Simulate database failure
      mockDataSource.query.mockRejectedValueOnce(new Error('Connection terminated unexpectedly'));

      const readiness = await healthService.checkReadiness();

      // Readiness must fail
      expect(readiness.ready).toBe(false);
      expect(readiness.status).toBe('not_ready');
      expect(readiness.dependencies.database.status).toBe('down');

      // Liveness probe must continue returning 'ok' (process is still alive)
      const liveness = await healthService.checkLiveness();
      expect(liveness.status).toBe('ok');
      expect(liveness.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should fail readiness when redis is down', async () => {
      mockRedisService.ping.mockRejectedValueOnce(new Error('Redis connection timeout'));

      const readiness = await healthService.checkReadiness();

      expect(readiness.ready).toBe(false);
      expect(readiness.status).toBe('not_ready');
      expect(readiness.dependencies.redis.status).toBe('down');
    });
  });

  describe('LogSanitizer: Privacy & Zero Leakage Enforcement', () => {
    it('should redact plain OTPs and start codes in objects', () => {
      const payload = {
        bookingId: 'BK-123',
        startOtp: '4821',
        otp: '1234',
        code: '9999',
      };

      const sanitized = LogSanitizer.sanitize(payload) as Record<string, unknown>;

      expect(sanitized.startOtp).toBe('[REDACTED_OTP]');
      expect(sanitized.otp).toBe('[REDACTED_OTP]');
      expect(sanitized.code).toBe('[REDACTED_OTP]');
      expect(sanitized.bookingId).toBe('BK-123');
    });

    it('should redact personal coordinates and locations in objects', () => {
      const payload = {
        city: 'visakhapatnam',
        pickupLatitude: 17.7275,
        pickupLongitude: 83.3038,
        dropoffLocation: { lat: 17.7142, lng: 83.3235 },
      };

      const sanitized = LogSanitizer.sanitize(payload) as Record<string, unknown>;

      expect(sanitized.pickupLatitude).toBe('[REDACTED_COORDINATES]');
      expect(sanitized.pickupLongitude).toBe('[REDACTED_COORDINATES]');
      expect(sanitized.dropoffLocation).toBe('[REDACTED_COORDINATES]');
      expect(sanitized.city).toBe('visakhapatnam');
    });

    it('should redact credentials, tokens, and database passwords', () => {
      const payload = {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        password: 'SuperSecretPassword123!',
        token: 'secret_jwt_token',
      };

      const sanitized = LogSanitizer.sanitize(payload) as Record<string, unknown>;

      expect(sanitized.authorization).toBe('[REDACTED_SECRET]');
      expect(sanitized.password).toBe('[REDACTED_SECRET]');
      expect(sanitized.token).toBe('[REDACTED_SECRET]');
    });

    it('should redact credentials and OTPs in raw string messages and URLs', () => {
      const dbError =
        'Fatal: database error at postgres://ecoride_user:SECRET_PASS_99@db:5432/ecoride_db';
      const otpMessage = 'Driver arrived at pickup point, OTP: 4821. Provide to captain.';
      const tokenHeader = 'Authorization: Bearer secret_live_token_abc';

      expect(LogSanitizer.sanitizeString(dbError)).not.toContain('SECRET_PASS_99');
      expect(LogSanitizer.sanitizeString(dbError)).toContain(
        'postgres://ecoride_user:[REDACTED_SECRET]@',
      );

      expect(LogSanitizer.sanitizeString(otpMessage)).not.toContain('4821');
      expect(LogSanitizer.sanitizeString(otpMessage)).toContain('otp: [REDACTED_OTP]');

      expect(LogSanitizer.sanitizeString(tokenHeader)).not.toContain('secret_live_token_abc');
      expect(LogSanitizer.sanitizeString(tokenHeader)).toContain('Bearer [REDACTED_SECRET]');
    });

    it('should mask phone numbers to preserve rider/driver privacy', () => {
      const text = 'Notification dispatched to rider +919123400001 for ride BK-VIZAG-001';
      const sanitized = LogSanitizer.sanitizeString(text);

      expect(sanitized).not.toContain('+919123400001');
      expect(sanitized).toContain('+91*****0001');
    });
  });

  describe('MetricsService: Telemetry & Prometheus Format', () => {
    let metricsService: MetricsService;
    let mockDataSource: { isInitialized: boolean; query: jest.Mock };

    beforeEach(() => {
      mockDataSource = {
        isInitialized: true,
        query: jest.fn().mockImplementation(async (sql: string) => {
          if (sql.includes('"vehicles"')) return [{ count: 5 }];
          if (sql.includes('"zones"')) return [{ count: 4 }];
          return [{ count: 0 }];
        }),
      };
      metricsService = new MetricsService(mockDataSource as unknown as DataSource);
    });

    it('should collect HTTP request counts and memory usage', async () => {
      metricsService.incrementRequestCount(200);
      metricsService.incrementRequestCount(201);
      metricsService.incrementRequestCount(400);
      metricsService.incrementRequestCount(500);

      const metrics = await metricsService.getMetrics();

      expect(metrics.http.totalRequests).toBe(4);
      expect(metrics.http.requests2xx).toBe(2);
      expect(metrics.http.requests4xx).toBe(1);
      expect(metrics.http.requests5xx).toBe(1);
      expect(metrics.evDomain.propulsionEnforcement).toBe('100%_BATTERY_ELECTRIC');
      expect(metrics.evDomain.activeVehiclesCount).toBe(5);
      expect(metrics.evDomain.activeZonesCount).toBe(4);
    });

    it('should generate valid Prometheus text exposition format', async () => {
      metricsService.incrementRequestCount(200);
      const text = await metricsService.getPrometheusMetrics();

      expect(text).toContain('# TYPE process_uptime_seconds gauge');
      expect(text).toContain('process_uptime_seconds');
      expect(text).toContain('http_requests_total{status="2xx"}');
      expect(text).toContain('ecoride_ev_fleet_active_count 5');
      expect(text).toContain('ecoride_battery_electric_only_enforced 1');
    });
  });
});
