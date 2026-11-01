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

export interface LivenessResult {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
  memory: {
    heapUsedMb: number;
    rssMb: number;
  };
}

export interface ReadinessResult {
  status: 'ok' | 'not_ready';
  ready: boolean;
  timestamp: string;
  dependencies: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
    };
    redis: {
      status: 'up' | 'down';
      latencyMs?: number;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  /**
   * General health status probe.
   */
  async check(): Promise<HealthCheckResult> {
    const serviceName = this.configService.get('serviceName', { infer: true }) || 'ecoride-api';
    const dbCheck = await this.probeDatabase();
    const redisCheck = await this.probeRedis();

    const isHealthy = dbCheck.status === 'up' && redisCheck.status === 'up';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      service: serviceName,
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: dbCheck.status,
        },
        redis: {
          status: redisCheck.status,
        },
      },
    };
  }

  /**
   * Kubernetes / Container Liveness Probe (/health/live)
   * Signals that the Node.js process is alive and responsive.
   * Does NOT fail if external database/redis are temporarily unreachable.
   */
  async checkLiveness(): Promise<LivenessResult> {
    const memory = process.memoryUsage();
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
    };
  }

  /**
   * Kubernetes / Load Balancer Readiness Probe (/health/ready)
   * Strictly evaluates whether external dependencies (PostgreSQL + Redis) are operational.
   * A down database or redis forces status 'not_ready' and HTTP 503.
   */
  async checkReadiness(): Promise<ReadinessResult> {
    const dbCheck = await this.probeDatabase();
    const redisCheck = await this.probeRedis();

    const isReady = dbCheck.status === 'up' && redisCheck.status === 'up';

    return {
      status: isReady ? 'ok' : 'not_ready',
      ready: isReady,
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbCheck,
        redis: redisCheck,
      },
    };
  }

  private async probeDatabase(): Promise<{ status: 'up' | 'down'; latencyMs?: number }> {
    const start = Date.now();
    try {
      if (!this.dataSource.isInitialized) {
        return { status: 'down' };
      }
      await Promise.race([
        this.dataSource.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('probe_timeout')), 2000)),
      ]);
      const latencyMs = Date.now() - start;
      return { status: 'up', latencyMs };
    } catch {
      // Intentionally never log connection strings or credentials
      this.logger.warn('Database readiness probe failed (status: down)');
      return { status: 'down' };
    }
  }

  private async probeRedis(): Promise<{ status: 'up' | 'down'; latencyMs?: number }> {
    const start = Date.now();
    try {
      const isUp = await Promise.race([
        this.redisService.ping(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('redis_timeout')), 2000),
        ),
      ]);
      const latencyMs = Date.now() - start;
      return { status: isUp ? 'up' : 'down', latencyMs };
    } catch {
      this.logger.warn('Redis readiness probe failed (status: down)');
      return { status: 'down' };
    }
  }
}
