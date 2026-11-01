/**
 * EcoRide Authentication & OTP Contracts (EV-016)
 * Strict specifications for India-format phone numbers, short OTP expiry,
 * attempt limits, resend cooldowns, and replay prevention.
 */

/**
 * Strict Indian mobile phone regex in E.164 format:
 * +91 followed by a 10-digit mobile number starting with 6, 7, 8, or 9.
 */
export const INDIA_PHONE_REGEX = /^\+91[6-9]\d{9}$/;

/**
 * OTP Security Constraints
 */
export const OTP_EXPIRY_SECONDS = 300; // 5 minutes
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // 60 seconds minimum interval
export const OTP_MAX_ATTEMPTS = 3; // Max 3 failed attempts before lockout

export type AuthOtpPurpose = 'LOGIN' | 'RIDE_START' | 'EMERGENCY';

export interface SendOtpRequest {
  phone: string;
  purpose?: AuthOtpPurpose;
}

export interface SendOtpResponse {
  referenceId: string;
  phone: string;
  expiresAt: string; // ISO-8601 UTC
  cooldownSeconds: number;
  deliveryChannel: 'SMS' | 'WHATSAPP';
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
  purpose?: AuthOtpPurpose;
  referenceId?: string;
  platform?: string;
  deviceId?: string;
}

export interface UserSessionPayload {
  token: string;
  sessionId: string;
  userId: string;
  role: string;
  expiresAt: string;
}

export interface AuthenticatedUserPayload {
  id: string;
  phone: string;
  role: string;
  isActive: boolean;
}

export interface VerifyOtpResponse {
  valid: boolean;
  verified: boolean;
  purpose: AuthOtpPurpose;
  session?: UserSessionPayload;
  user?: AuthenticatedUserPayload;
}
