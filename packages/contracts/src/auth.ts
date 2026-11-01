/**
 * EcoRide Authentication, Token, Session & Production OTP Lifecycle Contracts (EV-016, EV-017, EV-018)
 * Strict specifications for India-format phone numbers, short OTP expiry,
 * short-lived access tokens, rotated refresh sessions, DLT templates, and delivery status categories.
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

/**
 * Token & Session Lifecycle Constraints (EV-017)
 */
export const ACCESS_TOKEN_EXPIRY_SECONDS = 900; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_SECONDS = 2592000; // 30 days

export type AuthOtpPurpose = 'LOGIN' | 'RIDE_START' | 'EMERGENCY';

/**
 * Supported notification and template locales in Andhra Pradesh.
 * 'te': Telugu (Primary state language)
 * 'en': English (Business standard)
 * 'hi': Hindi (Inter-state mobility)
 */
export type OtpLocale = 'te' | 'en' | 'hi';

/**
 * Unified delivery-status categories across all SMS/OTP providers (EV-018).
 * Complies with Telecom Regulatory Authority of India (TRAI) and telco SMSC status reporting.
 */
export type OtpDeliveryStatusCategory =
  | 'DELIVERED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'RETRYING'
  | 'FAILED_DND'
  | 'FAILED_OPERATOR'
  | 'FAILED_EXPIRED'
  | 'REJECTED_CREDENTIALS';

export type OtpProviderType = 'MOCK' | 'MSG91';

export interface SendOtpRequest {
  phone: string;
  purpose?: AuthOtpPurpose;
  locale?: OtpLocale;
}

export interface SendOtpResponse {
  referenceId: string;
  phone: string;
  expiresAt: string; // ISO-8601 UTC
  cooldownSeconds: number;
  deliveryChannel: 'SMS' | 'WHATSAPP';
  statusCategory?: OtpDeliveryStatusCategory;
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
  token: string; // Access token (Bearer)
  accessToken: string;
  refreshToken: string; // Raw rotated refresh token (sent to client once)
  sessionId: string;
  userId: string;
  role: string;
  expiresAt: string;
  expiresIn?: number;
  tokenType?: 'Bearer';
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
  statusCategory?: OtpDeliveryStatusCategory;
  session?: UserSessionPayload;
  user?: AuthenticatedUserPayload;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 900 seconds
  tokenType: 'Bearer';
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface SessionDto {
  id: string;
  userId: string;
  platform: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  expiresAt: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent?: boolean;
}

export interface RevokeAllSessionsResponse {
  success: boolean;
  revokedCount: number;
}

/**
 * Definition of a DLT (Distributed Ledger Technology) registered content template.
 */
export interface OtpTemplateDefinition {
  dltTemplateId: string;
  templateText: string;
  otpLength: 4 | 6;
  expiryMinutes: number;
}

/**
 * Production OTP Provider Configuration (EV-018)
 */
export interface OtpProviderConfig {
  providerType: OtpProviderType;
  enabled: boolean;
  senderId: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  dltPeId: string;
}

/**
 * Telemetry delivery audit record.
 */
export interface OtpDeliveryReport {
  referenceId: string;
  phoneMasked: string;
  purpose: AuthOtpPurpose;
  status: OtpDeliveryStatusCategory;
  provider: OtpProviderType;
  operatorCode?: string;
  failureReason?: string;
  timestamp: string; // ISO-8601
}
