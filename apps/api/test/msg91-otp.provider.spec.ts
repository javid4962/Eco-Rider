import {
  ServiceUnavailableException,
  BadGatewayException,
  GatewayTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Msg91OtpProvider, FetchFunction } from '../src/modules/providers/msg91/msg91-otp.provider';
import {
  DLT_TEMPLATES,
  getDltTemplate,
} from '../src/modules/providers/msg91/templates/dlt-templates';
import { OtpDeliveryStatusCategory, OtpLocale } from '@ecoride/contracts';

describe('Msg91OtpProvider — Production OTP Interface (EV-018)', () => {
  const validTestKey = 'test_msg91_auth_key_1234567890abcdef12';
  const testPhone = '+919876543210';
  const expectedNormalizedPhone = '919876543210';

  function createMockConfig(env: Record<string, string | undefined>): ConfigService {
    return {
      get: jest.fn().mockImplementation((key: string) => env[key]),
    } as unknown as ConfigService;
  }

  describe('1. Safety Gate: Real Sending Disabled by Default', () => {
    it('should fail safely when MSG91_ENABLED is false', async () => {
      const mockFetch: FetchFunction = jest.fn();
      const config = createMockConfig({
        MSG91_ENABLED: 'false',
        MSG91_AUTH_KEY: validTestKey,
      });

      const provider = new Msg91OtpProvider(config, mockFetch);

      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(
        'MSG91 OTP provider is not activated. Live sending is disabled until operational approval.',
      );
      await expect(provider.verifyOtp(testPhone, '123456')).rejects.toThrow(
        ServiceUnavailableException,
      );

      // Verify zero network calls were attempted
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fail safely when MSG91_ENABLED is not set at all', async () => {
      const mockFetch: FetchFunction = jest.fn();
      const config = createMockConfig({});
      const provider = new Msg91OtpProvider(config, mockFetch);

      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('2. Missing or Incomplete Credentials Safety', () => {
    it('should fail safely when MSG91_ENABLED is true but MSG91_AUTH_KEY is undefined', async () => {
      const mockFetch: FetchFunction = jest.fn();
      const config = createMockConfig({
        MSG91_ENABLED: 'true',
        MSG91_AUTH_KEY: undefined,
      });

      const provider = new Msg91OtpProvider(config, mockFetch);

      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(
        'MSG91 credentials missing or unconfigured. Live sending is disabled.',
      );
      await expect(provider.verifyOtp(testPhone, '123456')).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fail safely when MSG91_AUTH_KEY is an empty string', async () => {
      const mockFetch: FetchFunction = jest.fn();
      const config = createMockConfig({
        MSG91_ENABLED: 'true',
        MSG91_AUTH_KEY: '   ',
      });

      const provider = new Msg91OtpProvider(config, mockFetch);

      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('3. Zero Secret Leaks & PII Privacy Redaction', () => {
    it('should never expose the auth key in exception messages or provider metadata', async () => {
      const mockFetch: FetchFunction = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized: Invalid AuthKey',
      } as Response);

      const config = createMockConfig({
        MSG91_ENABLED: 'true',
        MSG91_AUTH_KEY: validTestKey,
      });

      const provider = new Msg91OtpProvider(config, mockFetch);

      try {
        await provider.sendOtp(testPhone, 'LOGIN');
        fail('Expected BadGatewayException');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadGatewayException);
        const errMessage = (err as Error).message;
        expect(errMessage).not.toContain(validTestKey);
      }

      // Metadata config check
      const exposedConfig = provider.getConfig();
      expect((exposedConfig as unknown as Record<string, unknown>).authKey).toBeUndefined();
    });
  });

  describe('4. Template Localization (Telugu, English, Hindi)', () => {
    const activeConfig = createMockConfig({
      MSG91_ENABLED: 'true',
      MSG91_AUTH_KEY: validTestKey,
      MSG91_SENDER_ID: 'ECORID',
    });

    it('should accurately resolve Telugu, English, and Hindi DLT templates for LOGIN', async () => {
      const mockFetch: FetchFunction = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          type: 'success',
          message: 'OTP sent successfully',
          request_id: 'req_login_001',
        }),
      } as Response);

      const provider = new Msg91OtpProvider(activeConfig, mockFetch);

      // Telugu ('te')
      const resTe = await provider.sendOtp(testPhone, 'LOGIN', 'te');
      expect(resTe.referenceId).toBe('req_login_001');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining(`template_id=${DLT_TEMPLATES.LOGIN.te.dltTemplateId}`),
        expect.anything(),
      );

      // English ('en')
      await provider.sendOtp(testPhone, 'LOGIN', 'en');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining(`template_id=${DLT_TEMPLATES.LOGIN.en.dltTemplateId}`),
        expect.anything(),
      );

      // Hindi ('hi')
      await provider.sendOtp(testPhone, 'LOGIN', 'hi');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining(`template_id=${DLT_TEMPLATES.LOGIN.hi.dltTemplateId}`),
        expect.anything(),
      );
    });

    it('should format 4-digit code for RIDE_START and 6-digit code for LOGIN/EMERGENCY', async () => {
      const mockFetch: FetchFunction = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          type: 'success',
          message: 'OTP sent successfully',
          request_id: 'req_rs_002',
        }),
      } as Response);

      const provider = new Msg91OtpProvider(activeConfig, mockFetch);

      // RIDE_START -> otp_length=4
      await provider.sendOtp(testPhone, 'RIDE_START', 'te');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('otp_length=4'),
        expect.anything(),
      );

      // LOGIN -> otp_length=6
      await provider.sendOtp(testPhone, 'LOGIN', 'en');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('otp_length=6'),
        expect.anything(),
      );

      // EMERGENCY -> otp_length=6
      await provider.sendOtp(testPhone, 'EMERGENCY', 'hi');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('otp_length=6'),
        expect.anything(),
      );
    });

    it('should default to English if unsupported locale is requested', () => {
      const template = getDltTemplate('LOGIN', 'fr' as OtpLocale);
      expect(template.dltTemplateId).toBe(DLT_TEMPLATES.LOGIN.en.dltTemplateId);
    });
  });

  describe('5. E.164 Phone Normalization & Header Credentials', () => {
    it('should strip plus sign from Indian phone numbers and pass authkey in HTTP header', async () => {
      let capturedUrl = '';
      let capturedHeaders: Record<string, string> = {};

      const mockFetch: FetchFunction = jest.fn().mockImplementation(async (url, init) => {
        capturedUrl = url.toString();
        capturedHeaders = (init?.headers || {}) as Record<string, string>;
        return {
          ok: true,
          json: async () => ({ type: 'success', request_id: 'req_norm_123' }),
        } as Response;
      });

      const config = createMockConfig({
        MSG91_ENABLED: 'true',
        MSG91_AUTH_KEY: validTestKey,
        MSG91_SENDER_ID: 'ECORID',
      });

      const provider = new Msg91OtpProvider(config, mockFetch);
      await provider.sendOtp('+919876543210', 'LOGIN');

      expect(capturedUrl).toContain(`mobile=${expectedNormalizedPhone}`);
      expect(capturedUrl).not.toContain('+91');
      expect(capturedHeaders['authkey']).toBe(validTestKey);
    });
  });

  describe('6. Timeout Enforcement', () => {
    it('should abort and fail with GatewayTimeoutException after timeoutMs expires', async () => {
      const mockFetch: FetchFunction = jest.fn().mockImplementation(async (_url, init) => {
        return new Promise<Response>((_resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              const abortErr = new Error('The operation was aborted');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          }
        });
      });

      const config = createMockConfig({
        MSG91_ENABLED: 'true',
        MSG91_AUTH_KEY: validTestKey,
        MSG91_TIMEOUT_MS: '20', // Fast 20ms timeout for test
        MSG91_MAX_RETRIES: '0', // No retries to verify timeout
      });

      const provider = new Msg91OtpProvider(config, mockFetch);

      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(GatewayTimeoutException);
      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(
        'MSG91 OTP request timed out after 20ms.',
      );
    });
  });

  describe('7. Retry with Exponential Backoff on 5xx Errors', () => {
    it('should retry transient 500 error and succeed on second attempt', async () => {
      let callCount = 0;
      const mockFetch: FetchFunction = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ type: 'success', request_id: 'retry_success_req' }),
        } as Response;
      });

      const config = createMockConfig({
        MSG91_ENABLED: 'true',
        MSG91_AUTH_KEY: validTestKey,
        MSG91_TIMEOUT_MS: '1000',
        MSG91_MAX_RETRIES: '2',
      });

      const provider = new Msg91OtpProvider(config, mockFetch);
      const res = await provider.sendOtp(testPhone, 'LOGIN');

      expect(callCount).toBe(2);
      expect(res.referenceId).toBe('retry_success_req');
      expect(res.statusCategory).toBe('SUBMITTED');
    });

    it('should not retry on 401 client error and fail immediately', async () => {
      let callCount = 0;
      const mockFetch: FetchFunction = jest.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: false,
          status: 401,
          text: async () => 'Invalid AuthKey',
        } as Response;
      });

      const config = createMockConfig({
        MSG91_ENABLED: 'true',
        MSG91_AUTH_KEY: validTestKey,
        MSG91_MAX_RETRIES: '2',
      });

      const provider = new Msg91OtpProvider(config, mockFetch);

      await expect(provider.sendOtp(testPhone, 'LOGIN')).rejects.toThrow(BadGatewayException);
      // Ensure only 1 attempt was made (no retries for 4xx)
      expect(callCount).toBe(1);
    });
  });

  describe('8. Verify OTP Workflow & Edge Cases', () => {
    const config = createMockConfig({
      MSG91_ENABLED: 'true',
      MSG91_AUTH_KEY: validTestKey,
    });

    it('should return valid=true when MSG91 returns success', async () => {
      const mockFetch: FetchFunction = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'success', message: 'OTP verified success' }),
      } as Response);

      const provider = new Msg91OtpProvider(config, mockFetch);
      const res = await provider.verifyOtp(testPhone, '4821');

      expect(res.valid).toBe(true);
      expect(res.statusCategory).toBe('DELIVERED');
    });

    it('should return FAILED_EXPIRED when MSG91 returns code 205 (OTP expired)', async () => {
      const mockFetch: FetchFunction = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'error', message: 'OTP expired', code: 205 }),
      } as Response);

      const provider = new Msg91OtpProvider(config, mockFetch);
      const res = await provider.verifyOtp(testPhone, '4821');

      expect(res.valid).toBe(false);
      expect(res.statusCategory).toBe('FAILED_EXPIRED');
      expect(res.reason).toContain('OTP has expired');
    });

    it('should return REJECTED_CREDENTIALS and remainingAttempts=0 when max limit reached (code 206)', async () => {
      const mockFetch: FetchFunction = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'error', message: 'Max limit reached', code: 206 }),
      } as Response);

      const provider = new Msg91OtpProvider(config, mockFetch);
      const res = await provider.verifyOtp(testPhone, '4821');

      expect(res.valid).toBe(false);
      expect(res.statusCategory).toBe('REJECTED_CREDENTIALS');
      expect(res.remainingAttempts).toBe(0);
      expect(res.reason).toContain('Maximum OTP verification attempts exceeded');
    });

    it('should return REJECTED_CREDENTIALS on incorrect code', async () => {
      const mockFetch: FetchFunction = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'error', message: 'OTP not match', code: 204 }),
      } as Response);

      const provider = new Msg91OtpProvider(config, mockFetch);
      const res = await provider.verifyOtp(testPhone, '0000');

      expect(res.valid).toBe(false);
      expect(res.statusCategory).toBe('REJECTED_CREDENTIALS');
      expect(res.reason).toContain('Invalid OTP code');
    });
  });

  describe('9. Delivery-Status Category Mapping', () => {
    const config = createMockConfig({});
    const provider = new Msg91OtpProvider(config);

    const expectations: Array<[string | number, OtpDeliveryStatusCategory]> = [
      ['1', 'DELIVERED'],
      ['DELIVRD', 'DELIVERED'],
      ['DELIVERED', 'DELIVERED'],
      ['2', 'SUBMITTED'],
      ['AWAITING_DELIVERY', 'SUBMITTED'],
      ['SENT', 'SUBMITTED'],
      ['16', 'PENDING'],
      ['QUEUED', 'PENDING'],
      ['8', 'RETRYING'],
      ['17', 'FAILED_DND'],
      ['DND_REJECTED', 'FAILED_DND'],
      ['NDNC', 'FAILED_DND'],
      ['32', 'FAILED_OPERATOR'],
      ['UNDELIV', 'FAILED_OPERATOR'],
      ['64', 'FAILED_EXPIRED'],
      ['EXPIRED', 'FAILED_EXPIRED'],
      ['128', 'REJECTED_CREDENTIALS'],
      ['AUTH_FAILURE', 'REJECTED_CREDENTIALS'],
      ['UNKNOWN_CODE', 'SUBMITTED'],
    ];

    test.each(expectations)(
      'should map provider code %s to category %s',
      (code, expectedCategory) => {
        expect(provider.mapDeliveryStatus(code)).toBe(expectedCategory);
      },
    );
  });
});
