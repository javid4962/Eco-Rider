import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const redisConfig = this.configService.get('redis', { infer: true });
    try {
      this.client = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null, // Do not endlessly retry in health check or offline mode
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection warning: ${err.message}`);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis initialization failed: ${msg}`);
      this.client = null;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    try {
      if (this.client.status !== 'ready') {
        await this.client.connect().catch(() => {});
      }
      const response = await Promise.race([
        this.client.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 1500),
        ),
      ]);
      return response === 'PONG';
    } catch {
      return false;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }
}
