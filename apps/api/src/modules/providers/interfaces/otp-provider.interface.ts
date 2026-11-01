import { OtpDeliveryStatusCategory, OtpLocale, AuthOtpPurpose } from '@ecoride/contracts';

export type OtpPurpose = AuthOtpPurpose;

export interface OtpSendResult {
  referenceId: string;
  expiresAt: string; // ISO-8601 UTC
  deliveryChannel: 'SMS' | 'WHATSAPP';
  cooldownSeconds?: number;
  statusCategory?: OtpDeliveryStatusCategory;
}

export interface OtpVerifyResult {
  valid: boolean;
  reason?: string;
  remainingAttempts?: number;
  statusCategory?: OtpDeliveryStatusCategory;
}

export interface IOtpProvider {
  sendOtp(phone: string, purpose: OtpPurpose, locale?: OtpLocale): Promise<OtpSendResult>;
  verifyOtp(
    phone: string,
    code: string,
    referenceId?: string,
    purpose?: OtpPurpose,
  ): Promise<OtpVerifyResult>;
  mapDeliveryStatus?(statusCode: string | number): OtpDeliveryStatusCategory;
}
