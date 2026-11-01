export type OtpPurpose = 'LOGIN' | 'RIDE_START' | 'EMERGENCY';

export interface OtpSendResult {
  referenceId: string;
  expiresAt: string; // ISO-8601 UTC
  deliveryChannel: 'SMS' | 'WHATSAPP';
  cooldownSeconds?: number;
}

export interface OtpVerifyResult {
  valid: boolean;
  reason?: string;
  remainingAttempts?: number;
}

export interface IOtpProvider {
  sendOtp(phone: string, purpose: OtpPurpose): Promise<OtpSendResult>;
  verifyOtp(
    phone: string,
    code: string,
    referenceId?: string,
    purpose?: OtpPurpose,
  ): Promise<OtpVerifyResult>;
}
