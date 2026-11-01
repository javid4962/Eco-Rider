import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ISmsProvider, SmsSendRequest, SmsSendResult } from '../interfaces/sms-provider.interface';

@Injectable()
export class MockSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);
  private readonly sentMessages: SmsSendRequest[] = [];

  async sendSms(request: SmsSendRequest): Promise<SmsSendResult> {
    const messageId = `mock_sms_${randomUUID().substring(0, 10)}`;
    const timestamp = new Date().toISOString();

    this.sentMessages.push({ ...request });

    const lang = request.language || 'en';
    const correlation = request.correlationId ? `[Corr: ${request.correlationId}] ` : '';

    this.logger.log(
      `[MockSmsProvider] ${correlation}Sent mock SMS to ${request.toPhone} (${lang}): "${request.message}" (MsgId: ${messageId})`,
    );

    return {
      messageId,
      delivered: true,
      carrierStatus: 'DELIVERED_MOCK_AP_OPERATOR',
      timestamp,
    };
  }

  getSentMessages(): readonly SmsSendRequest[] {
    return this.sentMessages;
  }

  clearSentMessages(): void {
    this.sentMessages.length = 0;
  }
}
