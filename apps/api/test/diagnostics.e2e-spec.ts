import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/health/health.service';
import { MetricsService } from '../src/modules/health/metrics.service';
import { DataSource } from 'typeorm';
import { RedisService } from '../src/modules/redis/redis.service';
import { ConfigModule } from '@nestjs/config';

describe('App & API Diagnostics (E2E Integration)', () => {
  let app: INestApplication;
  let controller: HealthController;
  let mockDataSource: {
    isInitialized: boolean;
    query: jest.Mock;
  };
  let mockRedisService: {
    ping: jest.Mock;
  };

  beforeAll(async () => {
    mockDataSource = {
      isInitialized: true,
      query: jest.fn().mockImplementation(async (sql: string) => {
        if (sql === 'SELECT 1') return [{ '?column?': 1 }];
        if (sql.includes('"vehicles"')) return [{ count: 5 }];
        if (sql.includes('"zones"')) return [{ count: 4 }];
        return [];
      }),
    };

    mockRedisService = {
      ping: jest.fn().mockResolvedValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              serviceName: 'ecoride-api',
            }),
          ],
        }),
      ],
      controllers: [HealthController],
      providers: [
        HealthService,
        MetricsService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    controller = app.get<HealthController>(HealthController);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health/live should return 200 OK with process uptime', async () => {
    const liveResult = await controller.getLiveness();

    expect(liveResult.status).toBe('ok');
    expect(liveResult.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(liveResult.memory.heapUsedMb).toBeGreaterThan(0);
  });

  it('GET /health/ready should return 200 OK when database and redis are online', async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
    };

    const readyResult = await controller.getReadiness(mockRes as unknown as Response);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(readyResult.ready).toBe(true);
    expect(readyResult.status).toBe('ok');
    expect(readyResult.dependencies.database.status).toBe('up');
    expect(readyResult.dependencies.redis.status).toBe('up');
  });

  it('DEMONSTRATE ACCEPTANCE: database down makes readiness fail with 503 while liveness remains 200 OK', async () => {
    // 1. Force database query to fail
    mockDataSource.query.mockRejectedValueOnce(new Error('FATAL: Database connection timeout'));

    const mockRes = {
      status: jest.fn().mockReturnThis(),
    };

    const readyResult = await controller.getReadiness(mockRes as unknown as Response);

    // Readiness probe must return 503 Service Unavailable
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(readyResult.ready).toBe(false);
    expect(readyResult.status).toBe('not_ready');
    expect(readyResult.dependencies.database.status).toBe('down');

    // Liveness probe MUST stay meaningful and return HTTP 200
    const liveResult = await controller.getLiveness();
    expect(liveResult.status).toBe('ok');
    expect(liveResult.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('GET /health/metrics should return JSON runtime metrics with EV domain telemetry', async () => {
    const metrics = await controller.getMetrics();

    expect(metrics).toHaveProperty('uptimeSeconds');
    expect(metrics).toHaveProperty('memory');
    expect(metrics).toHaveProperty('http');
    expect(metrics.evDomain.propulsionEnforcement).toBe('100%_BATTERY_ELECTRIC');
    expect(metrics.evDomain.activePilotCity).toBe('visakhapatnam');
  });

  it('GET /metrics should return standard Prometheus text format metrics', async () => {
    const prometheusText = await controller.getPrometheusMetrics();

    expect(prometheusText).toContain('# HELP process_uptime_seconds');
    expect(prometheusText).toContain('process_uptime_seconds');
    expect(prometheusText).toContain('ecoride_battery_electric_only_enforced 1');
  });
});
