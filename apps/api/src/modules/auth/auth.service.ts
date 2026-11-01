import {
  Injectable,
  Inject,
  BadRequestException,
  HttpException,
  HttpStatus,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, RiderProfile, Session } from '../../database/entities';
import {
  INDIA_PHONE_REGEX,
  PlatformRole,
  ROLE_SCOPES,
  ApiErrorCode,
  SendOtpResponse,
  VerifyOtpResponse,
  RefreshTokenResponse,
  LogoutResponse,
  SessionDto,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from '@ecoride/contracts';
import { OTP_PROVIDER } from '../providers/providers.constants';
import { IOtpProvider } from '../providers/interfaces/otp-provider.interface';
import { MockOtpProvider } from '../providers/mock/mock-otp.provider';
import { IdentityService } from '../identity/identity.service';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import { TokenService } from './token.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, LogoutDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(OTP_PROVIDER)
    private readonly otpProvider: IOtpProvider,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly identityService: IdentityService,
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
  ) {
    this.assertNotProductionWithMock();
  }

  /**
   * Enforces that MockOtpProvider cannot be used when running in production.
   */
  private assertNotProductionWithMock(): void {
    if (process.env.NODE_ENV === 'production' && this.otpProvider instanceof MockOtpProvider) {
      throw new Error(
        'FATAL: MockOtpProvider is a synthetic test adapter and cannot be enabled in production environment.',
      );
    }
  }

  /**
   * Request an OTP with strict India phone format, resend cooldown, and short expiry.
   */
  async sendOtp(
    dto: SendOtpDto,
    clientIp?: string,
    correlationId?: string,
  ): Promise<SendOtpResponse> {
    this.assertNotProductionWithMock();

    // 1. Strict India phone format validation: +91 followed by 10 digits starting with 6-9
    if (!INDIA_PHONE_REGEX.test(dto.phone)) {
      throw new BadRequestException(
        'Phone number must be a valid Indian mobile number in E.164 format (+91 followed by 10 digits starting with 6-9)',
      );
    }

    const purpose = dto.purpose || 'LOGIN';

    try {
      const result = await this.otpProvider.sendOtp(dto.phone, purpose);

      await this.identityService.recordAuditEvent({
        action: 'OTP_SENT',
        entityType: 'OTP',
        entityId: result.referenceId,
        newState: {
          phone: dto.phone,
          purpose,
          expiresAt: result.expiresAt,
          deliveryChannel: result.deliveryChannel,
        },
        ipAddress: clientIp,
        correlationId,
        status: 'SUCCESS',
      });

      return {
        referenceId: result.referenceId,
        phone: dto.phone,
        expiresAt: result.expiresAt,
        cooldownSeconds: result.cooldownSeconds || 60,
        deliveryChannel: result.deliveryChannel,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.startsWith('RESEND_COOLDOWN:')) {
        const remainingSeconds = errorMsg.split(':')[1] || '60';
        throw new HttpException(
          {
            code: ApiErrorCode.RATE_LIMITED,
            message: `Resend cooldown active. Please wait ${remainingSeconds} second(s) before requesting another OTP.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (errorMsg.includes('production')) {
        throw error;
      }

      this.logger.error(`Failed to send OTP: ${errorMsg}`);
      throw new BadRequestException('Failed to send OTP. Please check input and try again.');
    }
  }

  /**
   * Verify an OTP with attempt throttling, replay prevention, and session generation.
   */
  async verifyOtp(
    dto: VerifyOtpDto,
    clientIp?: string,
    userAgent?: string,
    correlationId?: string,
  ): Promise<VerifyOtpResponse> {
    this.assertNotProductionWithMock();

    // 1. Strict India phone format validation
    if (!INDIA_PHONE_REGEX.test(dto.phone)) {
      throw new BadRequestException(
        'Phone number must be a valid Indian mobile number in E.164 format (+91 followed by 10 digits starting with 6-9)',
      );
    }

    const purpose = dto.purpose || 'LOGIN';
    const verifyResult = await this.otpProvider.verifyOtp(
      dto.phone,
      dto.code,
      dto.referenceId,
      purpose,
    );

    if (!verifyResult.valid) {
      if (verifyResult.reason === 'MAX_ATTEMPTS_EXCEEDED') {
        await this.identityService.recordAuditEvent({
          action: 'OTP_LOCKOUT',
          entityType: 'OTP',
          entityId: dto.phone,
          newState: { phone: dto.phone, purpose, reason: 'MAX_ATTEMPTS_EXCEEDED' },
          ipAddress: clientIp,
          correlationId,
          status: 'FAILED',
        });

        throw new HttpException(
          {
            code: ApiErrorCode.RATE_LIMITED,
            message:
              'Maximum OTP verification attempts exceeded. This OTP has been invalidated for security reasons. Please request a new OTP.',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (verifyResult.reason === 'OTP_EXPIRED') {
        throw new BadRequestException('OTP has expired. Please request a new OTP.');
      }

      if (verifyResult.reason === 'OTP_NOT_FOUND_OR_EXPIRED') {
        throw new BadRequestException(
          'OTP not found, expired, or already used. Please request a new OTP.',
        );
      }

      if (verifyResult.reason === 'INVALID_OTP_CODE') {
        await this.identityService.recordAuditEvent({
          action: 'OTP_VERIFY_FAILED',
          entityType: 'OTP',
          entityId: dto.phone,
          newState: {
            phone: dto.phone,
            purpose,
            remainingAttempts: verifyResult.remainingAttempts ?? 0,
          },
          ipAddress: clientIp,
          correlationId,
          status: 'FAILED',
        });

        throw new BadRequestException(
          `Invalid OTP code. ${verifyResult.remainingAttempts ?? 0} attempt(s) remaining.`,
        );
      }

      throw new BadRequestException(verifyResult.reason || 'Failed to verify OTP code.');
    }

    // OTP verified successfully (single-use consumed atomically)
    await this.identityService.recordAuditEvent({
      action: 'OTP_VERIFIED',
      entityType: 'OTP',
      entityId: dto.phone,
      newState: { phone: dto.phone, purpose },
      ipAddress: clientIp,
      correlationId,
      status: 'SUCCESS',
    });

    // For RIDE_START or EMERGENCY verification, no session is created
    if (purpose !== 'LOGIN') {
      return {
        valid: true,
        verified: true,
        purpose,
      };
    }

    // For LOGIN: find user or auto-provision as RIDER
    let user = await this.userRepository.findOne({ where: { phone: dto.phone } });

    if (!user) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        user = queryRunner.manager.create(User, {
          phone: dto.phone,
          role: PlatformRole.RIDER,
          isActive: true,
        });
        user = await queryRunner.manager.save(User, user);

        const profile = queryRunner.manager.create(RiderProfile, {
          userId: user.id,
          tier: 'STANDARD',
          rating: '5.00',
          totalRides: 0,
          greenDistanceKm: '0.00',
          co2SavedKg: '0.000',
          preferredPaymentMode: 'UPI',
        });
        await queryRunner.manager.save(RiderProfile, profile);

        await this.identityService.recordAuditEvent({
          actorId: user.id,
          targetUserId: user.id,
          action: 'USER_AUTO_PROVISIONED',
          entityType: 'USER',
          entityId: user.id,
          newState: { phone: user.phone, role: user.role },
          ipAddress: clientIp,
          correlationId,
          status: 'SUCCESS',
        });

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is deactivated. Please contact support.');
    }

    // Issue authentic session with short-lived access token and rotated refresh session
    const sessionResult = await this.createSessionAndTokens(
      user,
      dto.platform || 'MOBILE',
      dto.deviceId,
      clientIp,
      userAgent,
      correlationId,
    );

    return {
      valid: true,
      verified: true,
      purpose: 'LOGIN',
      session: {
        token: sessionResult.accessToken, // Primary Bearer token
        accessToken: sessionResult.accessToken,
        refreshToken: sessionResult.refreshToken, // Plaintext refresh token sent ONCE
        sessionId: sessionResult.session.id,
        userId: user.id,
        role: user.role,
        expiresAt: sessionResult.session.expiresAt.toISOString(),
        expiresIn: sessionResult.expiresIn,
        tokenType: 'Bearer',
      },
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Internal session & token creation.
   * Generates plaintext refresh token sent ONCE to client, storing only the SHA-256 hash.
   */
  async createSessionAndTokens(
    user: User,
    platform = 'WEB',
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string,
  ) {
    const rawRefreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = this.sessionRepository.create({
      userId: user.id,
      tokenHash,
      platform,
      deviceId,
      ipAddress,
      userAgent,
      expiresAt,
      isRevoked: false,
    });

    const saved = await this.sessionRepository.save(session);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      role: user.role,
      scopes: ROLE_SCOPES[user.role] || [],
      sessionId: saved.id,
    });

    await this.identityService.recordAuditEvent({
      actorId: user.id,
      targetUserId: user.id,
      action: 'SESSION_CREATED',
      entityType: 'SESSION',
      entityId: saved.id,
      newState: { platform, deviceId, ipAddress },
      ipAddress,
      correlationId,
      status: 'SUCCESS',
    });

    return {
      session: saved,
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      tokenType: 'Bearer' as const,
    };
  }

  /**
   * Refresh access token with Refresh Token Rotation and Replay Detection.
   * If a previously rotated token is replayed, triggers global session revocation for security.
   */
  async refreshTokens(
    dto: RefreshTokenDto,
    clientIp?: string,
    userAgent?: string,
    correlationId?: string,
  ): Promise<RefreshTokenResponse> {
    const incomingHash = this.tokenService.hashToken(dto.refreshToken);

    // 1. Check for token reuse / replay of an already rotated refresh token
    const replayedSession = await this.sessionRepository.findOne({
      where: { previousTokenHash: incomingHash },
    });

    if (replayedSession) {
      this.logger.warn(
        `[SECURITY ALERT] Suspected refresh token replay detected for user ${replayedSession.userId}. Initiating global session revocation.`,
      );

      // Suspected compromise: atomically invalidate all sessions for this user
      await this.sessionRepository.update({ userId: replayedSession.userId }, { isRevoked: true });

      await this.identityService.recordAuditEvent({
        targetUserId: replayedSession.userId,
        action: 'TOKEN_REUSE_DETECTED',
        entityType: 'SESSION',
        entityId: replayedSession.id,
        newState: {
          reason: 'ROTATED_REFRESH_TOKEN_REPLAY',
          clientIp,
        },
        ipAddress: clientIp,
        correlationId,
        status: 'DENIED',
      });

      throw new UnauthorizedException(
        'Suspected token compromise detected. All user sessions have been terminated. Please log in again.',
      );
    }

    // 2. Query session by active tokenHash
    const session = await this.sessionRepository.findOne({
      where: { tokenHash: incomingHash },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token. Please log in again.');
    }

    // 3. Check if session was revoked (e.g. after logout or compromise)
    if (session.isRevoked) {
      this.logger.warn(
        `[SECURITY ALERT] Attempt to use revoked refresh token for user ${session.userId}.`,
      );

      // Trigger global revocation on suspected reuse of revoked token
      await this.sessionRepository.update({ userId: session.userId }, { isRevoked: true });

      await this.identityService.recordAuditEvent({
        targetUserId: session.userId,
        action: 'REVOKED_TOKEN_REUSE',
        entityType: 'SESSION',
        entityId: session.id,
        newState: { reason: 'REVOKED_SESSION_REUSE', clientIp },
        ipAddress: clientIp,
        correlationId,
        status: 'DENIED',
      });

      throw new UnauthorizedException(
        'This session has been revoked. All active sessions terminated. Please log in again.',
      );
    }

    // 4. Check session expiration
    if (Date.now() > session.expiresAt.getTime()) {
      throw new UnauthorizedException('Refresh token session has expired. Please log in again.');
    }

    // 5. Check user status
    if (session.user && !session.user.isActive) {
      throw new ForbiddenException('User account is deactivated. Please contact customer support.');
    }

    // 6. Rotate refresh token (RFC 6819 Token Rotation)
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash = this.tokenService.hashToken(newRefreshToken);

    session.previousTokenHash = session.tokenHash;
    session.tokenHash = newTokenHash;
    session.lastActiveAt = new Date();
    if (clientIp) session.ipAddress = clientIp;
    if (userAgent) session.userAgent = userAgent;

    await this.sessionRepository.save(session);

    const userRole = session.user?.role || PlatformRole.RIDER;
    const accessToken = this.tokenService.generateAccessToken({
      sub: session.userId,
      role: userRole,
      scopes: ROLE_SCOPES[userRole] || [],
      sessionId: session.id,
    });

    await this.identityService.recordAuditEvent({
      actorId: session.userId,
      targetUserId: session.userId,
      action: 'TOKEN_REFRESHED',
      entityType: 'SESSION',
      entityId: session.id,
      ipAddress: clientIp,
      correlationId,
      status: 'SUCCESS',
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      tokenType: 'Bearer',
    };
  }

  /**
   * Revoke session on user logout.
   */
  async logout(
    dto: LogoutDto,
    actor?: CurrentActorPayload,
    clientIp?: string,
    correlationId?: string,
  ): Promise<LogoutResponse> {
    let sessionToRevoke: Session | null = null;

    if (dto.refreshToken) {
      const hash = this.tokenService.hashToken(dto.refreshToken);
      sessionToRevoke = await this.sessionRepository.findOne({ where: { tokenHash: hash } });
    } else if (actor?.sessionId) {
      sessionToRevoke = await this.sessionRepository.findOne({
        where: { id: actor.sessionId, userId: actor.id },
      });
    }

    if (sessionToRevoke) {
      sessionToRevoke.isRevoked = true;
      await this.sessionRepository.save(sessionToRevoke);

      await this.identityService.recordAuditEvent({
        actorId: sessionToRevoke.userId,
        targetUserId: sessionToRevoke.userId,
        action: 'LOGOUT',
        entityType: 'SESSION',
        entityId: sessionToRevoke.id,
        ipAddress: clientIp,
        correlationId,
        status: 'SUCCESS',
      });
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * List active sessions for authenticated caller. Never leaks token secrets.
   */
  async getSessionsForActor(actor: CurrentActorPayload): Promise<SessionDto[]> {
    if (!actor || actor.id === '00000000-0000-0000-0000-000000000000') {
      throw new UnauthorizedException('Authentication required to list sessions');
    }

    const sessions = await this.sessionRepository.find({
      where: { userId: actor.id, isRevoked: false },
      order: { lastActiveAt: 'DESC' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      platform: s.platform,
      deviceId: s.deviceId,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      isRevoked: s.isRevoked,
      expiresAt: s.expiresAt instanceof Date ? s.expiresAt.toISOString() : s.expiresAt,
      lastActiveAt: s.lastActiveAt instanceof Date ? s.lastActiveAt.toISOString() : s.lastActiveAt,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      isCurrent: actor.sessionId ? s.id === actor.sessionId : false,
    }));
  }

  /**
   * Revoke specific session belonging to authenticated actor.
   */
  async revokeSessionForActor(actor: CurrentActorPayload, sessionId: string) {
    if (!actor || actor.id === '00000000-0000-0000-0000-000000000000') {
      throw new UnauthorizedException('Authentication required');
    }
    return this.identityService.revokeSession(actor, actor.id, sessionId);
  }

  /**
   * Revoke all sessions belonging to authenticated actor (suspected compromise or user global logout).
   */
  async revokeAllSessionsForActor(actor: CurrentActorPayload, reason = 'USER_GLOBAL_LOGOUT') {
    if (!actor || actor.id === '00000000-0000-0000-0000-000000000000') {
      throw new UnauthorizedException('Authentication required');
    }
    return this.identityService.revokeAllUserSessions(actor, actor.id, reason);
  }
}
