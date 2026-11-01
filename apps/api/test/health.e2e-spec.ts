import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/health/health.service';
import { MetricsService } from '../src/modules/health/metrics.service';
import { DataSource } from 'typeorm';
import { RedisService } from '../src/modules/redis/redis.service';
import { ConfigModule } from '@nestjs/config';
import { Response } from 'express';

describe('Health Module Integration (e2e)', () => {
  let app: INestApplication;
  let controller: HealthController;
  const mockDataSource = {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };
  const mockRedisService = {
    ping: jest.fn().mockResolvedValue(true),
  };

  beforeAll(async () => {
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

  it('resolves /health handler and returns 200 with healthy payload', async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const result = await controller.getHealth(mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(result.status).toBe('ok');
    expect(result.service).toBe('ecoride-api');
    expect(result.dependencies.database.status).toBe('up');
    expect(result.dependencies.redis.status).toBe('up');
  });

  it('returns 503 degraded when database dependency fails', async () => {
    mockDataSource.query.mockRejectedValueOnce(new Error('DB unreachable'));
    const mockRes = {
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const result = await controller.getHealth(mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(result.status).toBe('degraded');
    expect(result.dependencies.database.status).toBe('down');
  });
});
