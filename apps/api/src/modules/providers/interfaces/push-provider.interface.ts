export interface PushNotificationRequest {
  recipientToken: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

export interface PushNotificationResult {
  notificationId: string;
  delivered: boolean;
  timestamp: string; // ISO-8601 UTC
}

export interface IPushNotificationProvider {
  sendNotification(request: PushNotificationRequest): Promise<PushNotificationResult>;
  sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }>;
}
