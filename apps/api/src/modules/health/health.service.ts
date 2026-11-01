import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  dependencies: {
    database: {
      status: 'up' | 'down';
    };
    redis: {
      status: 'up' | 'down';
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<AppConfig, true>
  ) {}

  async check(): Promise<HealthCheckResult> {
    const serviceName = this.configService.get('serviceName', { infer: true }) || 'ecoride-api';
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();

    const isHealthy = dbStatus === 'up' && redisStatus === 'up';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      service: serviceName,
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: dbStatus,
        },
        redis: {
          status: redisStatus,
        },
      },
    };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      if (!this.dataSource.isInitialized) {
        return 'down';
      }
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
      return 'up';
    } catch {
      // Intentionally log generic warning and never leak connection string or credentials
      this.logger.warn('Database health check probe failed');
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      const isUp = await this.redisService.ping();
      return isUp ? 'up' : 'down';
    } catch {
      this.logger.warn('Redis health check probe failed');
      return 'down';
    }
  }
}

