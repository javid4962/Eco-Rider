import {
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
  BadGatewayException,
  GatewayTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthOtpPurpose,
  OtpDeliveryStatusCategory,
  OtpLocale,
  OtpProviderConfig,
} from '@ecoride/contracts';
import { IOtpProvider, OtpSendResult, OtpVerifyResult } from '../interfaces/otp-provider.interface';
import { getDltTemplate } from './templates/dlt-templates';
import * as crypto from 'crypto';

export type FetchFunction = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

@Injectable()
export class Msg91OtpProvider implements IOtpProvider {
  private readonly logger = new Logger(Msg91OtpProvider.name);

  private readonly enabled: boolean;
  private readonly authKey?: string;
  private readonly senderId: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly dltPeId: string;
  private readonly fetchFn: FetchFunction;

  constructor(
    private readonly configService: ConfigService,
    @Optional() customFetch?: FetchFunction,
  ) {
    this.enabled = this.configService.get<string>('MSG91_ENABLED') === 'true';
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY') || undefined;
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || 'ECORID';
    this.baseUrl =
      this.configService.get<string>('MSG91_BASE_URL') || 'https://control.msg91.com/api/v5/otp';
    this.timeoutMs = parseInt(this.configService.get<string>('MSG91_TIMEOUT_MS') || '5000', 10);
    this.maxRetries = parseInt(this.configService.get<string>('MSG91_MAX_RETRIES') || '2', 10);
    this.dltPeId = this.configService.get<string>('MSG91_DLT_PE_ID') || '1101550000000012345';
    this.fetchFn = customFetch || (globalThis.fetch as FetchFunction);

    if (this.enabled && (!this.authKey || !this.authKey.trim())) {
      this.logger.warn(
        '[SECURITY WARNING] MSG91_ENABLED is true but MSG91_AUTH_KEY is not configured. Live dispatch will fail safely.',
      );
    }
  }

  /**
   * Returns provider configuration metadata (stripping any sensitive keys).
   */
  getConfig(): OtpProviderConfig {
    return {
      providerType: 'MSG91',
      enabled: this.enabled,
      senderId: this.senderId,
      baseUrl: this.baseUrl,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
      dltPeId: this.dltPeId,
    };
  }

  /**
   * Helper to mask phone numbers in logs and audit reports.
   * Format: +919123400001 -> +91*****0001
   */
  private maskPhone(phone: string): string {
    return phone.replace(/(\+?91)?[6-9]\d{5}(\d{4})/g, '$1*****$2');
  }

  /**
   * Normalizes Indian E.164 phone number for MSG91 API:
   * Strips '+' or non-digit characters. E.g. "+919876543210" -> "919876543210".
   */
  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  }

  /**
   * Checks safety guards ensuring real sending cannot occur when unapproved or unconfigured.
   */
  private assertProviderReady(): void {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'MSG91 OTP provider is not activated. Live sending is disabled until operational approval.',
      );
    }

    if (!this.authKey || !this.authKey.trim()) {
      throw new ServiceUnavailableException(
        'MSG91 credentials missing or unconfigured. Live sending is disabled.',
      );
    }
  }

  /**
   * Executes HTTP request with timeout enforcement using AbortController.
   */
  private async executeWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchFn(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GatewayTimeoutException(`MSG91 OTP request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Dispatches OTP via MSG91 v5 API with template localization, timeout, and exponential backoff retry.
   */
  async sendOtp(
    phone: string,
    purpose: AuthOtpPurpose = 'LOGIN',
    locale: OtpLocale = 'en',
  ): Promise<OtpSendResult> {
    // 1. Enforce safety gates
    this.assertProviderReady();

    const normalizedPhone = this.normalizePhone(phone);
    const template = getDltTemplate(purpose, locale);

    const url = new URL(this.baseUrl);
    url.searchParams.set('template_id', template.dltTemplateId);
    url.searchParams.set('mobile', normalizedPhone);
    url.searchParams.set('otp_length', template.otpLength.toString());
    url.searchParams.set('otp_expiry', template.expiryMinutes.toString());
    if (this.senderId) {
      url.searchParams.set('sender', this.senderId);
    }

    const headers: Record<string, string> = {
      authkey: this.authKey!,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    let lastError: Error | null = null;
    let response: Response | null = null;

    // Retry loop with exponential backoff on transient network or 5xx carrier errors
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        response = await this.executeWithTimeout(url.toString(), {
          method: 'POST',
          headers,
        });

        // If server returns 5xx (transient gateway error), retry
        if (response.status >= 500 && attempt < this.maxRetries) {
          const backoff = 100 * Math.pow(2, attempt);
          this.logger.warn(
            `[MSG91 Gateway Error ${response.status}] Retrying attempt ${attempt + 1}/${this.maxRetries} after ${backoff}ms...`,
          );
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        // On 4xx (client configuration/credential error), do NOT retry
        if (response.status >= 400 && response.status < 500) {
          const bodyText = await response.text();
          this.logger.error(
            `[MSG91 Client Error ${response.status}] Request rejected by provider: ${bodyText}`,
          );
          throw new BadGatewayException(
            `MSG91 rejected OTP dispatch with HTTP ${response.status}.`,
          );
        }

        break;
      } catch (err: unknown) {
        if (err instanceof BadGatewayException) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        if (
          (err instanceof GatewayTimeoutException ||
            (err instanceof Error && err.name === 'AbortError')) &&
          attempt < this.maxRetries
        ) {
          const backoff = 100 * Math.pow(2, attempt);
          this.logger.warn(
            `[MSG91 Timeout] Retrying attempt ${attempt + 1}/${this.maxRetries} after ${backoff}ms...`,
          );
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        if (attempt >= this.maxRetries) {
          break;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new BadGatewayException('Failed to communicate with MSG91 gateway.');
    }

    const data = (await response.json()) as {
      type?: string;
      message?: string;
      request_id?: string;
    };

    if (data.type === 'error') {
      throw new BadGatewayException(data.message || 'MSG91 returned delivery error.');
    }

    const referenceId = data.request_id || crypto.randomUUID();

    // Authoritative sanitized logging: never logs authkey or raw OTP value
    this.logger.log(
      `Dispatched OTP via MSG91 to ${this.maskPhone(phone)} [Purpose: ${purpose}, Locale: ${locale}, Template: ${template.dltTemplateId}, Ref: ${referenceId}]`,
    );

    return {
      referenceId,
      expiresAt: new Date(Date.now() + template.expiryMinutes * 60 * 1000).toISOString(),
      deliveryChannel: 'SMS',
      cooldownSeconds: 60,
      statusCategory: 'SUBMITTED',
    };
  }

  /**
   * Verifies submitted OTP against MSG91 /verify endpoint.
   * Sensitive OTP code and authkey are never logged.
   */
  async verifyOtp(
    phone: string,
    code: string,
    _referenceId?: string,
    purpose?: AuthOtpPurpose,
  ): Promise<OtpVerifyResult> {
    // 1. Enforce safety gates
    this.assertProviderReady();

    const normalizedPhone = this.normalizePhone(phone);
    const url = new URL(`${this.baseUrl}/verify`);
    url.searchParams.set('mobile', normalizedPhone);
    url.searchParams.set('otp', code);

    const headers: Record<string, string> = {
      authkey: this.authKey!,
      Accept: 'application/json',
    };

    let response: Response;
    try {
      response = await this.executeWithTimeout(url.toString(), {
        method: 'GET',
        headers,
      });
    } catch (err: unknown) {
      if (err instanceof GatewayTimeoutException) {
        throw err;
      }
      throw new BadGatewayException('Failed to connect to MSG91 verification service.');
    }

    const data = (await response.json()) as {
      type?: string;
      message?: string;
      code?: number;
    };

    if (data.type === 'success') {
      this.logger.log(
        `Verified OTP for ${this.maskPhone(phone)} [Purpose: ${purpose || 'LOGIN'}]: SUCCESS`,
      );
      return {
        valid: true,
        statusCategory: 'DELIVERED',
      };
    }

    // Map provider rejection codes without leaking secrets
    const msg = (data.message || '').toLowerCase();
    let reason = 'Invalid OTP code. Please try again.';
    let statusCategory: OtpDeliveryStatusCategory = 'REJECTED_CREDENTIALS';
    let remainingAttempts: number | undefined = undefined;

    if (data.code === 205 || msg.includes('expired')) {
      reason = 'OTP has expired. Please request a new OTP.';
      statusCategory = 'FAILED_EXPIRED';
    } else if (data.code === 206 || msg.includes('limit') || msg.includes('max')) {
      reason = 'Maximum OTP verification attempts exceeded.';
      statusCategory = 'REJECTED_CREDENTIALS';
      remainingAttempts = 0;
    }

    this.logger.warn(
      `Verified OTP for ${this.maskPhone(phone)} [Purpose: ${purpose || 'LOGIN'}]: FAILED (${statusCategory})`,
    );

    return {
      valid: false,
      reason,
      remainingAttempts,
      statusCategory,
    };
  }

  /**
   * Maps Indian telco and MSG91 status codes to unified OtpDeliveryStatusCategory.
   */
  mapDeliveryStatus(statusCode: string | number): OtpDeliveryStatusCategory {
    const code = String(statusCode).toUpperCase().trim();
    switch (code) {
      case '1':
      case 'DELIVRD':
      case 'DELIVERED':
        return 'DELIVERED';
      case '2':
      case 'AWAITING_DELIVERY':
      case 'SUBMITTED':
      case 'SENT':
        return 'SUBMITTED';
      case '16':
      case 'QUEUED':
      case 'PENDING':
        return 'PENDING';
      case '8':
      case 'RETRYING':
        return 'RETRYING';
      case '17':
      case 'DND_REJECTED':
      case 'NDNC':
      case 'FAILED_DND':
        return 'FAILED_DND';
      case '32':
      case 'UNDELIV':
      case 'OPERATOR_ERROR':
      case 'FAILED_OPERATOR':
        return 'FAILED_OPERATOR';
      case '64':
      case 'EXPIRED':
      case 'FAILED_EXPIRED':
        return 'FAILED_EXPIRED';
      case '128':
      case 'AUTH_FAILURE':
      case 'INVALID_TEMPLATE':
      case 'REJECTED_CREDENTIALS':
        return 'REJECTED_CREDENTIALS';
      default:
        return 'SUBMITTED';
    }
  }
}
