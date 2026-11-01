import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IPushNotificationProvider,
  PushNotificationRequest,
  PushNotificationResult,
} from '../interfaces/push-provider.interface';

@Injectable()
export class MockPushProvider implements IPushNotificationProvider {
  private readonly logger = new Logger(MockPushProvider.name);
  private readonly dispatchedNotifications: PushNotificationRequest[] = [];

  async sendNotification(request: PushNotificationRequest): Promise<PushNotificationResult> {
    const notificationId = `mock_push_${randomUUID().substring(0, 10)}`;
    const timestamp = new Date().toISOString();

    this.dispatchedNotifications.push({ ...request });

    this.logger.log(
      `[MockPushProvider] Dispatched mock push to user ${request.userId} (token: ${request.recipientToken.substring(0, 8)}...): "${request.title} - ${request.body}"`,
    );

    return {
      notificationId,
      delivered: true,
      timestamp,
    };
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    for (const token of tokens) {
      this.dispatchedNotifications.push({
        recipientToken: token,
        userId: 'multicast-user',
        title,
        body,
        data,
      });
      successCount++;
    }

    this.logger.log(`[MockPushProvider] Multicast sent to ${tokens.length} recipients: "${title}"`);

    return {
      successCount,
      failureCount: 0,
    };
  }

  getDispatchedNotifications(): readonly PushNotificationRequest[] {
    return this.dispatchedNotifications;
  }

  clearDispatchedNotifications(): void {
    this.dispatchedNotifications.length = 0;
  }
}
