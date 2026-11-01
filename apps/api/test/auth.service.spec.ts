import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AuthService } from '../src/modules/auth/auth.service';
import { MockOtpProvider } from '../src/modules/providers/mock/mock-otp.provider';
import { OTP_PROVIDER } from '../src/modules/providers/providers.constants';
import { IdentityService } from '../src/modules/identity/identity.service';
import { TokenService } from '../src/modules/auth/token.service';
import { ConfigService } from '@nestjs/config';
import { User, RiderProfile, Session } from '../src/database/entities';
import { PlatformRole, ApiErrorCode, ACCESS_TOKEN_EXPIRY_SECONDS } from '@ecoride/contracts';

describe('AuthService — OTP Verification & Token Lifecycle (EV-016 & EV-017)', () => {
  let authService: AuthService;
  let tokenService: TokenService;
  let otpProvider: MockOtpProvider;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let sessionRepository: jest.Mocked<Partial<Repository<Session>>>;
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
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test_jwt_secret_key_12345'),
    } as unknown as ConfigService;
    tokenService = new TokenService(mockConfigService);

    userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ id: 'mock-user-uuid', ...dto })),
      save: jest.fn().mockImplementation(async (entity) => ({ id: 'mock-user-uuid', ...entity })),
    };

    sessionRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({
        id: 'mock-session-uuid',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        isRevoked: false,
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (entity) => ({
        id: entity.id || 'mock-session-uuid',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        ...entity,
      })),
      update: jest.fn().mockResolvedValue({ affected: 1 } as never),
    };

    identityService = {
      recordAuditEvent: jest
        .fn()
        .mockResolvedValue({ id: 'mock-audit-uuid' } as unknown as User as never),
      revokeSession: jest
        .fn()
        .mockResolvedValue({ id: 'mock-session-uuid', isRevoked: true } as never),
      revokeAllUserSessions: jest.fn().mockResolvedValue({ count: 2, revoked: true } as never),
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
          provide: getRepositoryToken(Session),
          useValue: sessionRepository,
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
          provide: TokenService,
          useValue: tokenService,
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

  describe('User Auto-Provisioning & Session Issuance (EV-017)', () => {
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
      expect(result.session).toBeDefined();
      expect(result.session?.token).toBeDefined();
      expect(result.session?.accessToken).toBeDefined();
      expect(result.session?.refreshToken).toBeDefined();
      expect(result.session?.expiresIn).toBe(ACCESS_TOKEN_EXPIRY_SECONDS);
      expect(result.session?.tokenType).toBe('Bearer');
      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'mock-new-user-id',
          platform: 'RIDER_APP',
          deviceId: 'device-test-123',
          isRevoked: false,
        }),
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
      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'existing-user-uuid',
          platform: 'CAPTAIN_APP',
        }),
      );
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
      expect(sessionRepository.create).not.toHaveBeenCalled();
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

  describe('Token and Session Lifecycle (EV-017)', () => {
    const rawRefreshToken = 'initial_refresh_token_64_characters_hex_0123456789abcdef0123456789';
    const rawTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const mockSession: Partial<Session> = {
      id: 'mock-session-uuid',
      userId: 'mock-user-uuid',
      tokenHash: rawTokenHash,
      previousTokenHash: undefined,
      platform: 'MOBILE',
      deviceId: 'device-1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
      isRevoked: false,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      user: {
        id: 'mock-user-uuid',
        phone: '+919876543210',
        role: PlatformRole.RIDER,
        isActive: true,
      } as User,
    };

    describe('Refresh Token Rotation (RFC 6819)', () => {
      it('should successfully rotate tokens, updating previousTokenHash and returning new tokens', async () => {
        sessionRepository.findOne = jest.fn().mockImplementation(async (options) => {
          if (options?.where?.previousTokenHash) return null;
          if (options?.where?.tokenHash === rawTokenHash) return { ...mockSession };
          return null;
        });

        const refreshResult = await authService.refreshTokens(
          { refreshToken: rawRefreshToken },
          '127.0.0.1',
          'JestClient/1.0',
        );

        expect(refreshResult.accessToken).toBeDefined();
        expect(refreshResult.refreshToken).toBeDefined();
        expect(refreshResult.refreshToken).not.toEqual(rawRefreshToken);
        expect(refreshResult.expiresIn).toBe(ACCESS_TOKEN_EXPIRY_SECONDS);
        expect(refreshResult.tokenType).toBe('Bearer');

        // Check session repository save was called with rotated tokens
        expect(sessionRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mock-session-uuid',
            previousTokenHash: rawTokenHash,
            tokenHash: tokenService.hashToken(refreshResult.refreshToken),
          }),
        );

        // Verify JWT accessToken payload
        const verified = tokenService.verifyAccessToken(refreshResult.accessToken);
        expect(verified.sub).toBe('mock-user-uuid');
        expect(verified.role).toBe(PlatformRole.RIDER);
        expect(verified.sessionId).toBe('mock-session-uuid');
      });
    });

    describe('Replay Attack Detection & Global Revocation', () => {
      it('should detect reuse of a previously rotated refresh token and revoke all user sessions', async () => {
        const stolenOldToken = 'stolen_old_refresh_token_which_was_already_rotated_by_victim';
        const stolenHash = tokenService.hashToken(stolenOldToken);

        // Mock session where previousTokenHash matches the stolen old token
        sessionRepository.findOne = jest.fn().mockImplementation(async (options) => {
          if (options?.where?.previousTokenHash === stolenHash) {
            return {
              id: 'victim-session-id',
              userId: 'victim-user-id',
              tokenHash: 'newly_rotated_hash',
              previousTokenHash: stolenHash,
              isRevoked: false,
            };
          }
          return null;
        });

        await expect(
          authService.refreshTokens(
            { refreshToken: stolenOldToken },
            '192.168.1.100',
            'MaliciousAttacker/1.0',
          ),
        ).rejects.toThrow(
          new UnauthorizedException(
            'Suspected token compromise detected. All user sessions have been terminated. Please log in again.',
          ),
        );

        // Must trigger global session revocation for victim user
        expect(sessionRepository.update).toHaveBeenCalledWith(
          { userId: 'victim-user-id' },
          { isRevoked: true },
        );

        // Must record audit event
        expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            targetUserId: 'victim-user-id',
            action: 'TOKEN_REUSE_DETECTED',
            status: 'DENIED',
          }),
        );
      });
    });

    describe('Revoked Session Rejection', () => {
      it('should reject refresh on an already revoked session and trigger global revocation', async () => {
        const revokedSession = {
          ...mockSession,
          isRevoked: true,
        };

        sessionRepository.findOne = jest.fn().mockImplementation(async (options) => {
          if (options?.where?.previousTokenHash) return null;
          if (options?.where?.tokenHash === rawTokenHash) return revokedSession;
          return null;
        });

        await expect(authService.refreshTokens({ refreshToken: rawRefreshToken })).rejects.toThrow(
          new UnauthorizedException(
            'This session has been revoked. All active sessions terminated. Please log in again.',
          ),
        );

        expect(sessionRepository.update).toHaveBeenCalledWith(
          { userId: 'mock-user-uuid' },
          { isRevoked: true },
        );

        expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            targetUserId: 'mock-user-uuid',
            action: 'REVOKED_TOKEN_REUSE',
            status: 'DENIED',
          }),
        );
      });
    });

    describe('Expired Refresh Token', () => {
      it('should reject refresh if the session has expired', async () => {
        const expiredSession = {
          ...mockSession,
          expiresAt: new Date(Date.now() - 1000), // In past
        };

        sessionRepository.findOne = jest.fn().mockImplementation(async (options) => {
          if (options?.where?.previousTokenHash) return null;
          if (options?.where?.tokenHash === rawTokenHash) return expiredSession;
          return null;
        });

        await expect(authService.refreshTokens({ refreshToken: rawRefreshToken })).rejects.toThrow(
          new UnauthorizedException('Refresh token session has expired. Please log in again.'),
        );
      });
    });

    describe('Deactivated User Refresh', () => {
      it('should reject refresh if the user account is deactivated', async () => {
        const deactivatedUserSession = {
          ...mockSession,
          user: {
            id: 'mock-user-uuid',
            phone: '+919876543210',
            role: PlatformRole.RIDER,
            isActive: false,
          } as User,
        };

        sessionRepository.findOne = jest.fn().mockImplementation(async (options) => {
          if (options?.where?.previousTokenHash) return null;
          if (options?.where?.tokenHash === rawTokenHash) return deactivatedUserSession;
          return null;
        });

        await expect(authService.refreshTokens({ refreshToken: rawRefreshToken })).rejects.toThrow(
          new ForbiddenException('User account is deactivated. Please contact customer support.'),
        );
      });
    });

    describe('Logout', () => {
      it('should revoke session by refreshToken on logout', async () => {
        const activeSession = { ...mockSession, isRevoked: false };
        sessionRepository.findOne = jest.fn().mockResolvedValue(activeSession);

        const res = await authService.logout({ refreshToken: rawRefreshToken });

        expect(res.success).toBe(true);
        expect(res.message).toBe('Logged out successfully');
        expect(sessionRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isRevoked: true,
          }),
        );
        expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'LOGOUT',
            entityType: 'SESSION',
            status: 'SUCCESS',
          }),
        );
      });

      it('should revoke session by actor.sessionId if refreshToken is not passed in body', async () => {
        const activeSession = { ...mockSession, id: 'actor-session-id', isRevoked: false };
        sessionRepository.findOne = jest.fn().mockResolvedValue(activeSession);

        const res = await authService.logout(
          {},
          {
            id: 'mock-user-uuid',
            role: PlatformRole.RIDER,
            scopes: [],
            sessionId: 'actor-session-id',
          },
        );

        expect(res.success).toBe(true);
        expect(sessionRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'actor-session-id',
            isRevoked: true,
          }),
        );
      });
    });

    describe('Session Listing & Privacy (Never Leaking Secrets)', () => {
      it('should list sessions for actor without leaking token secrets or hashes', async () => {
        const callerSession: Session = {
          id: 'caller-session-id',
          userId: 'mock-user-uuid',
          tokenHash: 'secret-hash-1',
          previousTokenHash: 'secret-prev-hash-1',
          platform: 'RIDER_APP',
          deviceId: 'device-1',
          ipAddress: '127.0.0.1',
          userAgent: 'Flutter/3.0',
          isRevoked: false,
          expiresAt: new Date(Date.now() + 86400000),
          lastActiveAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          user: mockSession.user as User,
        };

        sessionRepository.find = jest.fn().mockResolvedValue([callerSession]);

        const sessions = await authService.getSessionsForActor({
          id: 'mock-user-uuid',
          role: PlatformRole.RIDER,
          scopes: [],
          sessionId: 'caller-session-id',
        });

        expect(sessions).toHaveLength(1);
        const s = sessions[0];
        expect(s.id).toBe('caller-session-id');
        expect(s.isCurrent).toBe(true);
        expect(s.platform).toBe('RIDER_APP');
        expect(s.deviceId).toBe('device-1');

        // Verify token secrets and hashes are completely omitted from response
        expect((s as unknown as Record<string, unknown>).tokenHash).toBeUndefined();
        expect((s as unknown as Record<string, unknown>).previousTokenHash).toBeUndefined();
        expect((s as unknown as Record<string, unknown>).rawToken).toBeUndefined();
      });

      it('should reject unauthenticated call to list sessions', async () => {
        await expect(
          authService.getSessionsForActor({
            id: '00000000-0000-0000-0000-000000000000',
            role: PlatformRole.RIDER,
            scopes: [],
          }),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('Session Revocation Actions', () => {
      it('should delegate revokeSessionForActor to identityService.revokeSession', async () => {
        const actor = {
          id: 'mock-user-uuid',
          role: PlatformRole.RIDER,
          scopes: [],
          sessionId: 'session-1',
        };
        const res = await authService.revokeSessionForActor(actor, 'session-to-revoke');
        expect(identityService.revokeSession).toHaveBeenCalledWith(
          actor,
          'mock-user-uuid',
          'session-to-revoke',
        );
        expect(res).toBeDefined();
      });

      it('should delegate revokeAllSessionsForActor to identityService.revokeAllUserSessions', async () => {
        const actor = {
          id: 'mock-user-uuid',
          role: PlatformRole.RIDER,
          scopes: [],
          sessionId: 'session-1',
        };
        const res = await authService.revokeAllSessionsForActor(actor, 'SUSPECTED_COMPROMISE');
        expect(identityService.revokeAllUserSessions).toHaveBeenCalledWith(
          actor,
          'mock-user-uuid',
          'SUSPECTED_COMPROMISE',
        );
        expect(res).toBeDefined();
      });
    });
  });
});
