import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuthService } from '../src/modules/auth/auth.service';
import { MockOtpProvider } from '../src/modules/providers/mock/mock-otp.provider';
import { OTP_PROVIDER } from '../src/modules/providers/providers.constants';
import { IdentityService } from '../src/modules/identity/identity.service';
import { User, RiderProfile } from '../src/database/entities';
import { PlatformRole, ApiErrorCode } from '@ecoride/contracts';

describe('AuthService & Mock OTP Verification (EV-016)', () => {
  let authService: AuthService;
  let otpProvider: MockOtpProvider;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let identityService: jest.Mocked<Partial<IdentityService>>;
  let mockQueryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      create: jest.Mock;
      save: jest.Mock;
    };
  };

  const validPhone = '+919876543210';
  const captainPhone = '+919123400011';

  beforeEach(async () => {
    // Reset NODE_ENV to test
    process.env.NODE_ENV = 'test';
    delete process.env.ENABLE_MOCK_PROVIDERS;

    otpProvider = new MockOtpProvider();

    userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ id: 'mock-user-uuid', ...dto })),
      save: jest.fn().mockImplementation(async (entity) => ({ id: 'mock-user-uuid', ...entity })),
    };

    identityService = {
      recordAuditEvent: jest
        .fn()
        .mockResolvedValue({ id: 'mock-audit-uuid' } as unknown as User as never),
      createSession: jest.fn().mockResolvedValue({
        rawToken: 'mock-bearer-token-1234567890abcdef',
        session: {
          id: 'mock-session-uuid',
          userId: 'mock-user-uuid',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      } as unknown as { session: never; rawToken: string }),
    };

    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest.fn().mockImplementation((entityClass, dto) => ({
          id: entityClass === User ? 'mock-new-user-id' : 'mock-profile-id',
          ...dto,
        })),
        save: jest.fn().mockImplementation(async (_entityClass, entity) => entity),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: OTP_PROVIDER,
          useValue: otpProvider,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(RiderProfile),
          useValue: {},
        },
        {
          provide: IdentityService,
          useValue: identityService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENABLE_MOCK_PROVIDERS;
    otpProvider.resetForTesting();
  });

  describe('India Phone Format Validation', () => {
    it('should reject invalid phone numbers without +91 prefix or invalid length', async () => {
      const invalidPhones = [
        '9876543210', // Missing +91
        '+12025550123', // US country code
        '+911234567890', // Starts with 1 (must start with 6, 7, 8, or 9)
        '+9198765', // Too short
        '+919876543210123', // Too long
        '+9198765abcd0', // Alphanumeric
      ];

      for (const phone of invalidPhones) {
        await expect(authService.sendOtp({ phone })).rejects.toThrow(BadRequestException);
        await expect(authService.verifyOtp({ phone, code: '123456' })).rejects.toThrow(
          BadRequestException,
        );
      }
    });

    it('should accept valid Indian mobile numbers in E.164 format (+91 followed by 10 digits starting with 6-9)', async () => {
      const validPhones = ['+919876543210', '+918765432109', '+917654321098', '+916543210987'];

      for (const phone of validPhones) {
        otpProvider.clearCooldownForTesting();
        const res = await authService.sendOtp({ phone });
        expect(res.referenceId).toBeDefined();
        expect(res.phone).toBe(phone);
        expect(res.deliveryChannel).toBe('SMS');
      }
    });
  });

  describe('Resend Cooldown (60 seconds)', () => {
    it('should reject immediate resend within 60 seconds with 429 RATE_LIMITED', async () => {
      await authService.sendOtp({ phone: validPhone });

      // Immediate 2nd send should trigger cooldown
      try {
        await authService.sendOtp({ phone: validPhone });
        fail('Expected 429 RATE_LIMITED exception');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const response = httpErr.getResponse() as Record<string, unknown>;
        expect(response.code).toBe(ApiErrorCode.RATE_LIMITED);
        expect(response.message).toContain('Resend cooldown active');
      }
    });

    it('should allow resend after cooldown reset', async () => {
      await authService.sendOtp({ phone: validPhone });
      otpProvider.clearCooldownForTesting(validPhone, 'LOGIN');

      const res = await authService.sendOtp({ phone: validPhone });
      expect(res.referenceId).toBeDefined();
    });
  });

  describe('Short Expiry (5 minutes)', () => {
    it('should fail verification when OTP has expired', async () => {
      await authService.sendOtp({ phone: validPhone });
      const code = otpProvider.getActiveOtpForTesting(validPhone, 'LOGIN')!;
      expect(code).toBeDefined();

      // Expire OTP using test helper
      otpProvider.expireOtpForTesting(validPhone, 'LOGIN');

      await expect(
        authService.verifyOtp({ phone: validPhone, code, purpose: 'LOGIN' }),
      ).rejects.toThrow('OTP has expired. Please request a new OTP.');
    });
  });

  describe('Attempt Limits and Lockout (3 attempts)', () => {
    it('should decrement remaining attempts on incorrect code and lockout after 3 attempts', async () => {
      await authService.sendOtp({ phone: validPhone });
      const realCode = otpProvider.getActiveOtpForTesting(validPhone, 'LOGIN')!;
      expect(realCode).toBeDefined();

      // Attempt 1: wrong code -> 2 remaining
      await expect(
        authService.verifyOtp({ phone: validPhone, code: '000000', purpose: 'LOGIN' }),
      ).rejects.toThrow('Invalid OTP code. 2 attempt(s) remaining.');

      // Attempt 2: wrong code -> 1 remaining
      await expect(
        authService.verifyOtp({ phone: validPhone, code: '111111', purpose: 'LOGIN' }),
      ).rejects.toThrow('Invalid OTP code. 1 attempt(s) remaining.');

      // Attempt 3: wrong code -> lockout with 429 RATE_LIMITED
      try {
        await authService.verifyOtp({ phone: validPhone, code: '222222', purpose: 'LOGIN' });
        fail('Expected 429 lockout');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const response = httpErr.getResponse() as Record<string, unknown>;
        expect(response.code).toBe(ApiErrorCode.RATE_LIMITED);
        expect(response.message).toContain('Maximum OTP verification attempts exceeded');
      }

      // Subsequent attempt (even with the correct code) must fail due to lockout
      try {
        await authService.verifyOtp({ phone: validPhone, code: realCode, purpose: 'LOGIN' });
        fail('Expected continued lockout');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        const httpErr = err as HttpException;
        expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });

  describe('Replay Prevention (Single-Use)', () => {
    it('should invalidate OTP immediately after successful verification and reject replay', async () => {
      await authService.sendOtp({ phone: validPhone });
      const activeOtp = otpProvider.getActiveOtpForTesting(validPhone, 'LOGIN')!;

      // First verification: success
      const result = await authService.verifyOtp({
        phone: validPhone,
        code: activeOtp,
        purpose: 'LOGIN',
      });
      expect(result.valid).toBe(true);
      expect(result.session).toBeDefined();

      // Immediate replay with the exact same code: must fail
      await expect(
        authService.verifyOtp({
          phone: validPhone,
          code: activeOtp,
          purpose: 'LOGIN',
        }),
      ).rejects.toThrow('OTP not found, expired, or already used. Please request a new OTP.');
    });
  });

  describe('User Auto-Provisioning & Session Issuance', () => {
    it('should auto-provision new RIDER user and create session on valid LOGIN OTP', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await authService.sendOtp({ phone: validPhone });
      const activeOtp = otpProvider.getActiveOtpForTesting(validPhone, 'LOGIN')!;

      const result = await authService.verifyOtp({
        phone: validPhone,
        code: activeOtp,
        purpose: 'LOGIN',
        platform: 'RIDER_APP',
        deviceId: 'device-test-123',
      });

      expect(result.valid).toBe(true);
      expect(result.verified).toBe(true);
      expect(result.user?.role).toBe(PlatformRole.RIDER);
      expect(result.session?.token).toBe('mock-bearer-token-1234567890abcdef');
      expect(identityService.createSession).toHaveBeenCalledWith(
        'mock-new-user-id',
        'RIDER_APP',
        'device-test-123',
        undefined,
        undefined,
      );
    });

    it('should create session for existing active user without re-creating profile', async () => {
      const existingUser: Partial<User> = {
        id: 'existing-user-uuid',
        phone: captainPhone,
        role: PlatformRole.CAPTAIN,
        isActive: true,
      };
      userRepository.findOne = jest.fn().mockResolvedValue(existingUser as User);

      await authService.sendOtp({ phone: captainPhone });
      const activeOtp = otpProvider.getActiveOtpForTesting(captainPhone, 'LOGIN')!;

      const result = await authService.verifyOtp({
        phone: captainPhone,
        code: activeOtp,
        purpose: 'LOGIN',
        platform: 'CAPTAIN_APP',
      });

      expect(result.valid).toBe(true);
      expect(result.user?.id).toBe('existing-user-uuid');
      expect(result.user?.role).toBe(PlatformRole.CAPTAIN);
      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('should reject login for deactivated user with 403 Forbidden', async () => {
      const deactivatedUser: Partial<User> = {
        id: 'deactivated-uuid',
        phone: validPhone,
        role: PlatformRole.RIDER,
        isActive: false,
      };
      userRepository.findOne = jest.fn().mockResolvedValue(deactivatedUser as User);

      await authService.sendOtp({ phone: validPhone });
      const activeOtp = otpProvider.getActiveOtpForTesting(validPhone, 'LOGIN')!;

      await expect(
        authService.verifyOtp({ phone: validPhone, code: activeOtp, purpose: 'LOGIN' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Ride Start 4-Digit OTP', () => {
    it('should verify 4-digit code for RIDE_START without issuing session', async () => {
      const result = await authService.sendOtp({ phone: validPhone, purpose: 'RIDE_START' });
      expect(result.referenceId).toBeDefined();

      const activeOtp = otpProvider.getActiveOtpForTesting(validPhone, 'RIDE_START')!;
      expect(activeOtp).toMatch(/^\d{4}$/); // Exactly 4 digits

      const verifyResult = await authService.verifyOtp({
        phone: validPhone,
        code: activeOtp,
        purpose: 'RIDE_START',
      });

      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.purpose).toBe('RIDE_START');
      expect(verifyResult.session).toBeUndefined();
      expect(identityService.createSession).not.toHaveBeenCalled();
    });
  });

  describe('Production Guard', () => {
    it('should throw fatal error when MockOtpProvider is enabled in production', () => {
      process.env.NODE_ENV = 'production';
      expect(() => new MockOtpProvider()).toThrow(
        'FATAL: MockOtpProvider is a synthetic test adapter and cannot be enabled in production environment.',
      );
    });

    it('should throw fatal error when ENABLE_MOCK_PROVIDERS is set to false', () => {
      process.env.ENABLE_MOCK_PROVIDERS = 'false';
      expect(() => new MockOtpProvider()).toThrow(
        'FATAL: MockOtpProvider is disabled when ENABLE_MOCK_PROVIDERS is set to false.',
      );
    });
  });
});
