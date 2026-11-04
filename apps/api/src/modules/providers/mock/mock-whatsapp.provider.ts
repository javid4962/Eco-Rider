import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IWhatsAppProvider,
  SendWhatsAppTemplateRequest,
  WhatsAppMessageResult,
} from '../interfaces/whatsapp-provider.interface';

const ALLOWED_TEMPLATES = new Set([
  'ecoride_ride_confirmed',
  'ecoride_driver_arrived',
  'ecoride_ride_started',
  'ecoride_ride_completed',
  'ecoride_sos_alert',
  'ecoride_pod_delivery_confirmed',
]);

@Injectable()
export class MockWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(MockWhatsAppProvider.name);
  private readonly sentMessages: WhatsAppMessageResult[] = [];

  async sendTemplateMessage(request: SendWhatsAppTemplateRequest): Promise<WhatsAppMessageResult> {
    const phone = (request.toPhone || '').trim();
    if (!/^\+91\d{10}$/.test(phone)) {
      throw new BadRequestException('Recipient must be a valid E.164 Indian mobile number (+91XXXXXXXXXX)');
    }

    if (!ALLOWED_TEMPLATES.has(request.templateName)) {
      throw new BadRequestException(`Unregistered WhatsApp business template: ${request.templateName}`);
    }

    if (!['te', 'en', 'hi'].includes(request.languageCode)) {
      throw new BadRequestException('Supported WhatsApp template languages are te, en, hi');
    }

    const messageId = `wamid_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
    const maskedPhone = `${phone.substring(0, 5)}*****${phone.substring(10)}`;

    const result: WhatsAppMessageResult = {
      messageId,
      status: 'SENT',
      recipientPhone: phone,
      deliveredAt: new Date().toISOString(),
    };

    this.sentMessages.push(result);

    this.logger.log(
      `[MockWhatsAppProvider] Dispatched WhatsApp template '${request.templateName}' (${request.languageCode}) to ${maskedPhone} (MsgId: ${messageId})`,
    );

    return result;
  }

  getSentMessagesForTesting(): WhatsAppMessageResult[] {
    return [...this.sentMessages];
  }
}

