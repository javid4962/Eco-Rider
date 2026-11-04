import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export type OfferTimeoutHandler = (offerId: string) => Promise<void>;

@Injectable()
export class DispatchOffersQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(DispatchOffersQueueService.name);
  private readonly redisDelayedKey = 'dispatch:offers:timeouts';
  private readonly inMemoryTimers = new Map<string, NodeJS.Timeout>();
  private timeoutHandler: OfferTimeoutHandler | null = null;

  constructor(@Optional() private readonly redisService?: RedisService) {}

  /**
   * Register the primary callback handler for expiring dispatch offer timeouts.
   */
  registerTimeoutHandler(handler: OfferTimeoutHandler): void {
    this.timeoutHandler = handler;
  }

  /**
   * Schedules a reliable timeout job for an expiring dispatch offer.
   * Leverages Redis sorted set for cluster persistence and in-memory precision timer.
   */
  async scheduleOfferTimeout(
    offerId: string,
    expiresAt: Date,
    customHandler?: OfferTimeoutHandler,
  ): Promise<string> {
    const jobId = `job_offer_timeout_${offerId}`;
    const expiresEpochMs = expiresAt.getTime();
    const now = Date.now();
    const delayMs = Math.max(0, expiresEpochMs - now);

    // 1. Persist to Redis delayed sorted set if Redis is connected
    const redis = this.redisService?.getClient();
    if (redis && redis.status === 'ready') {
      try {
        await redis.zadd(this.redisDelayedKey, expiresEpochMs, offerId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to enqueue offer timeout in Redis: ${msg}`);
      }
    }

    // 2. Schedule in-memory precision timer for immediate execution upon expiration
    this.cancelInMemoryTimer(offerId);

    const timer = setTimeout(async () => {
      this.inMemoryTimers.delete(offerId);

      // Remove from Redis delayed queue
      if (redis && redis.status === 'ready') {
        try {
          await redis.zrem(this.redisDelayedKey, offerId);
        } catch {
          // Ignore transient cleanup errors
        }
      }

      // Invoke registered timeout handler
      const handler = customHandler || this.timeoutHandler;
      if (handler) {
        try {
          await handler(offerId);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Error processing offer timeout for ${offerId}: ${msg}`);
        }
      }
    }, delayMs);

    // Allow node process to exit cleanly if this timer is active
    if (timer.unref) {
      timer.unref();
    }

    this.inMemoryTimers.set(offerId, timer);
    return jobId;
  }

  /**
   * Cancels scheduled timeout when an offer is explicitly accepted, declined, or cancelled.
   */
  async cancelOfferTimeout(offerId: string): Promise<void> {
    this.cancelInMemoryTimer(offerId);

    const redis = this.redisService?.getClient();
    if (redis && redis.status === 'ready') {
      try {
        await redis.zrem(this.redisDelayedKey, offerId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to remove offer timeout from Redis: ${msg}`);
      }
    }
  }

  /**
   * Queries Redis for any overdue offer timeouts that need processing.
   */
  async getOverdueOfferIdsFromRedis(targetTime: Date = new Date()): Promise<string[]> {
    const redis = this.redisService?.getClient();
    if (!redis || redis.status !== 'ready') {
      return [];
    }

    try {
      const maxScore = targetTime.getTime();
      return await redis.zrangebyscore(this.redisDelayedKey, '-inf', maxScore);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to query overdue offers from Redis: ${msg}`);
      return [];
    }
  }

  /**
   * Checks if an in-memory timer is currently active for an offer.
   */
  hasActiveTimer(offerId: string): boolean {
    return this.inMemoryTimers.has(offerId);
  }

  private cancelInMemoryTimer(offerId: string): void {
    const existing = this.inMemoryTimers.get(offerId);
    if (existing) {
      clearTimeout(existing);
      this.inMemoryTimers.delete(offerId);
    }
  }

  onModuleDestroy(): void {
    for (const timer of this.inMemoryTimers.values()) {
      clearTimeout(timer);
    }
    this.inMemoryTimers.clear();
  }
}
