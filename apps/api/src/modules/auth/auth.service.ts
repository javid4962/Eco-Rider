import {
  Injectable,
  Inject,
  BadRequestException,
  HttpException,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, RiderProfile } from '../../database/entities';
import {
  INDIA_PHONE_REGEX,
  PlatformRole,
  ApiErrorCode,
  SendOtpResponse,
  VerifyOtpResponse,
} from '@ecoride/contracts';
import { OTP_PROVIDER } from '../providers/providers.constants';
import { IOtpProvider } from '../providers/interfaces/otp-provider.interface';
import { MockOtpProvider } from '../providers/mock/mock-otp.provider';
import { IdentityService } from '../identity/identity.service';
import { SendOtpDto, VerifyOtpDto } from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(OTP_PROVIDER)
    private readonly otpProvider: IOtpProvider,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly identityService: IdentityService,
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

    // Issue authentic session
    const sessionResult = await this.identityService.createSession(
      user.id,
      dto.platform || 'MOBILE',
      dto.deviceId,
      clientIp,
      userAgent,
    );

    return {
      valid: true,
      verified: true,
      purpose: 'LOGIN',
      session: {
        token: sessionResult.rawToken,
        sessionId: sessionResult.session.id,
        userId: user.id,
        role: user.role,
        expiresAt: sessionResult.session.expiresAt.toISOString(),
      },
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
