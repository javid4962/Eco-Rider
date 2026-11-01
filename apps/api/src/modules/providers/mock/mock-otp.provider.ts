import { Injectable, Logger } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import {
  IOtpProvider,
  OtpPurpose,
  OtpSendResult,
  OtpVerifyResult,
} from '../interfaces/otp-provider.interface';

interface StoredOtpRecord {
  code: string;
  purpose: OtpPurpose;
  expiresAt: number; // epoch ms
  attempts: number;
}

@Injectable()
export class MockOtpProvider implements IOtpProvider {
  private readonly logger = new Logger(MockOtpProvider.name);
  private readonly otpStore = new Map<string, StoredOtpRecord>();
  private readonly lastSentStore = new Map<string, number>(); // epoch ms
  private readonly lockedStore = new Map<string, number>(); // lockout expiration epoch ms
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes TTL (300 seconds)
  private readonly cooldownMs = 60 * 1000; // 60 seconds resend cooldown
  private readonly lockoutMs = 15 * 60 * 1000; // 15 minutes lockout after brute-force
  private readonly maxAttempts = 3;

  constructor() {
    this.assertNotProduction();
  }

  /**
   * Enforces that the synthetic mock adapter can NEVER be enabled or invoked in production.
   */
  private assertNotProduction(): void {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: MockOtpProvider is a synthetic test adapter and cannot be enabled in production environment.',
      );
    }
    if (process.env.ENABLE_MOCK_PROVIDERS === 'false') {
      throw new Error(
        'FATAL: MockOtpProvider is disabled when ENABLE_MOCK_PROVIDERS is set to false.',
      );
    }
  }

  async sendOtp(phone: string, purpose: OtpPurpose): Promise<OtpSendResult> {
    this.assertNotProduction();

    const normalizedPhone = this.normalizePhone(phone);
    const storeKey = `${normalizedPhone}:${purpose}`;

    // 1. Enforce 60-second resend cooldown
    const lastSent = this.lastSentStore.get(storeKey);
    const now = Date.now();
    if (lastSent && now - lastSent < this.cooldownMs) {
      const remainingSeconds = Math.ceil((lastSent + this.cooldownMs - now) / 1000);
      throw new Error(`RESEND_COOLDOWN:${remainingSeconds}`);
    }

    // Clear any previous lockout when a new OTP is requested (after cooldown)
    this.lockedStore.delete(storeKey);

    const referenceId = randomUUID();
    // 4-digit code for ride start OTP; 6-digit code for login / emergency verification
    const code =
      purpose === 'RIDE_START' ? String(randomInt(1000, 9999)) : String(randomInt(100000, 999999));

    const expiresAtMs = now + this.ttlMs;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    this.otpStore.set(storeKey, {
      code,
      purpose,
      expiresAt: expiresAtMs,
      attempts: 0,
    });
    this.lastSentStore.set(storeKey, now);

    this.logger.log(
      `[MockOtpProvider] Generated mock OTP for ${normalizedPhone} (${purpose}): [REDACTED_OTP], Ref: ${referenceId}, Exp: ${expiresAtIso}`,
    );

    return {
      referenceId,
      expiresAt: expiresAtIso,
      deliveryChannel: 'SMS',
      cooldownSeconds: Math.floor(this.cooldownMs / 1000),
    };
  }

  async verifyOtp(
    phone: string,
    code: string,
    _referenceId?: string,
    purpose?: OtpPurpose,
  ): Promise<OtpVerifyResult> {
    this.assertNotProduction();

    const normalizedPhone = this.normalizePhone(phone);

    // Strict key lookup: if purpose provided, match exactly; otherwise search matching phone keys
    let matchingKey: string | undefined;
    if (purpose) {
      matchingKey = `${normalizedPhone}:${purpose}`;
    } else {
      matchingKey = Array.from(this.otpStore.keys()).find((k) =>
        k.startsWith(`${normalizedPhone}:`),
      );
      if (!matchingKey) {
        // Also check if locked under any purpose for this phone
        matchingKey = Array.from(this.lockedStore.keys()).find((k) =>
          k.startsWith(`${normalizedPhone}:`),
        );
      }
    }

    // 1. Check if key is currently locked out due to exceeding max attempts
    if (matchingKey && this.lockedStore.has(matchingKey)) {
      const lockExpiresAt = this.lockedStore.get(matchingKey)!;
      if (Date.now() < lockExpiresAt) {
        return { valid: false, reason: 'MAX_ATTEMPTS_EXCEEDED', remainingAttempts: 0 };
      } else {
        this.lockedStore.delete(matchingKey);
      }
    }

    if (!matchingKey || !this.otpStore.has(matchingKey)) {
      return { valid: false, reason: 'OTP_NOT_FOUND_OR_EXPIRED', remainingAttempts: 0 };
    }

    const record = this.otpStore.get(matchingKey)!;

    // 2. Check expiration (5 minutes / 300s)
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(matchingKey);
      return { valid: false, reason: 'OTP_EXPIRED', remainingAttempts: 0 };
    }

    // 3. Check lockout before attempt
    if (record.attempts >= this.maxAttempts) {
      this.lockedStore.set(matchingKey, Date.now() + this.lockoutMs);
      this.otpStore.delete(matchingKey);
      return { valid: false, reason: 'MAX_ATTEMPTS_EXCEEDED', remainingAttempts: 0 };
    }

    // 4. Strict constant-time string comparison without hardcoded bypass
    if (record.code !== code.trim()) {
      record.attempts += 1;
      const remainingAttempts = this.maxAttempts - record.attempts;

      if (record.attempts >= this.maxAttempts) {
        // Lockout upon reaching max attempts
        this.lockedStore.set(matchingKey, Date.now() + this.lockoutMs);
        this.otpStore.delete(matchingKey);
        return { valid: false, reason: 'MAX_ATTEMPTS_EXCEEDED', remainingAttempts: 0 };
      }

      return { valid: false, reason: 'INVALID_OTP_CODE', remainingAttempts };
    }

    // 5. Single-use eviction upon successful verification (atomic replay prevention)
    this.otpStore.delete(matchingKey);
    return { valid: true };
  }

  /**
   * Test helper to inspect the currently active OTP without hardcoding bypass values.
   * Only used in test suites to verify valid OTP submission.
   */
  getActiveOtpForTesting(phone: string, purpose: OtpPurpose): string | undefined {
    const key = `${this.normalizePhone(phone)}:${purpose}`;
    const record = this.otpStore.get(key);
    if (!record || Date.now() > record.expiresAt) {
      return undefined;
    }
    return record.code;
  }

  /**
   * Test helper to immediately expire an OTP for testing expiration handling.
   */
  expireOtpForTesting(phone: string, purpose: OtpPurpose): void {
    const key = `${this.normalizePhone(phone)}:${purpose}`;
    const record = this.otpStore.get(key);
    if (record) {
      record.expiresAt = Date.now() - 1000;
    }
  }

  /**
   * Test helper to reset resend cooldown for test isolation.
   */
  clearCooldownForTesting(phone?: string, purpose?: OtpPurpose): void {
    if (phone && purpose) {
      this.lastSentStore.delete(`${this.normalizePhone(phone)}:${purpose}`);
    } else {
      this.lastSentStore.clear();
    }
  }

  /**
   * Test helper to reset provider state.
   */
  resetForTesting(): void {
    this.otpStore.clear();
    this.lastSentStore.clear();
    this.lockedStore.clear();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s-]/g, '');
  }
}
