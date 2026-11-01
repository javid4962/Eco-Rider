import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/health/health.service';
import { MetricsService } from '../src/modules/health/metrics.service';
import { DataSource } from 'typeorm';
import { RedisService } from '../src/modules/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

describe('HealthController & HealthService', () => {
  let module: TestingModule;
  let controller: HealthController;
  let healthService: HealthService;
  let mockDataSource: { isInitialized: boolean; query: jest.Mock };
  let mockRedisService: { ping: jest.Mock };

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    mockRedisService = {
      ping: jest.fn().mockResolvedValue(true),
    };

    module = await Test.createTestingModule({
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
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('ecoride-api'),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(healthService).toBeDefined();
  });

  describe('when all dependencies are healthy', () => {
    it('should return status ok and 200 status code', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const result = await controller.getHealth(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(result.status).toBe('ok');
      expect(result.dependencies.database.status).toBe('up');
      expect(result.dependencies.redis.status).toBe('up');
      expect(result.service).toBe('ecoride-api');
    });
  });

  describe('when database is down', () => {
    it('should return status degraded and 503 status code without leaking connection info', async () => {
      mockDataSource.query.mockRejectedValue(
        new Error('Connection to postgresql://user:secret@db:5432 failed'),
      );
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const result = await controller.getHealth(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(result.status).toBe('degraded');
      expect(result.dependencies.database.status).toBe('down');
      expect(result.dependencies.redis.status).toBe('up');

      // Security requirement: Ensure NO connection strings or credentials leaked
      const stringified = JSON.stringify(result);
      expect(stringified).not.toContain('secret');
      expect(stringified).not.toContain('postgresql://');
      expect(stringified).not.toContain('5432');
    });
  });

  describe('when redis is down', () => {
    it('should return status degraded and 503 status code', async () => {
      mockRedisService.ping.mockResolvedValue(false);
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const result = await controller.getHealth(mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(result.status).toBe('degraded');
      expect(result.dependencies.redis.status).toBe('down');
    });
  });
});
