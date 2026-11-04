export interface SendWhatsAppTemplateRequest {
  toPhone: string;
  templateName: string;
  languageCode: 'te' | 'en' | 'hi';
  templateParameters: Record<string, string>;
}

export interface WhatsAppMessageResult {
  messageId: string;
  status: 'SENT' | 'FAILED' | 'QUEUED';
  recipientPhone: string;
  deliveredAt?: string;
  rejectionReason?: string;
}

export interface IWhatsAppProvider {
  sendTemplateMessage(request: SendWhatsAppTemplateRequest): Promise<WhatsAppMessageResult>;
}

