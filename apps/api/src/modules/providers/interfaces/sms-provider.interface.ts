export interface SmsSendRequest {
  toPhone: string;
  message: string;
  templateId?: string;
  language?: 'en' | 'te';
  correlationId?: string;
}

export interface SmsSendResult {
  messageId: string;
  delivered: boolean;
  carrierStatus: string;
  timestamp: string; // ISO-8601 UTC
}

export interface ISmsProvider {
  sendSms(request: SmsSendRequest): Promise<SmsSendResult>;
}
