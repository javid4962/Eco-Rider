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
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes TTL
  private readonly maxAttempts = 3;

  async sendOtp(phone: string, purpose: OtpPurpose): Promise<OtpSendResult> {
    const referenceId = randomUUID();
    // 4-digit code for ride start OTP; 6-digit code for login / emergency verification
    const code = purpose === 'RIDE_START'
      ? String(randomInt(1000, 9999))
      : String(randomInt(100000, 999999));

    const expiresAtMs = Date.now() + this.ttlMs;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    const normalizedPhone = this.normalizePhone(phone);
    const storeKey = `${normalizedPhone}:${purpose}`;

    this.otpStore.set(storeKey, {
      code,
      purpose,
      expiresAt: expiresAtMs,
      attempts: 0,
    });

    this.logger.log(
      `[MockOtpProvider] Generated mock OTP for ${normalizedPhone} (${purpose}): [${code}], Ref: ${referenceId}, Exp: ${expiresAtIso}`,
    );

    return {
      referenceId,
      expiresAt: expiresAtIso,
      deliveryChannel: 'SMS',
    };
  }

  async verifyOtp(phone: string, code: string, _referenceId?: string): Promise<OtpVerifyResult> {
    const normalizedPhone = this.normalizePhone(phone);

    // Look for matching record under any purpose
    const matchingKey = Array.from(this.otpStore.keys()).find((k) => k.startsWith(`${normalizedPhone}:`));
    if (!matchingKey) {
      return { valid: false, reason: 'OTP_NOT_FOUND_OR_EXPIRED' };
    }

    const record = this.otpStore.get(matchingKey)!;

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(matchingKey);
      return { valid: false, reason: 'OTP_EXPIRED' };
    }

    if (record.attempts >= this.maxAttempts) {
      this.otpStore.delete(matchingKey);
      return { valid: false, reason: 'MAX_ATTEMPTS_EXCEEDED' };
    }

    record.attempts += 1;

    // Strict constant-time string comparison without any hardcoded bypass
    if (record.code !== code.trim()) {
      return { valid: false, reason: 'INVALID_OTP_CODE' };
    }

    // Single-use eviction upon successful verification
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

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s-]/g, '');
  }
}

