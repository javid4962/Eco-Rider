import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { MockOtpProvider } from '../src/modules/providers/mock/mock-otp.provider';
import { OTP_PROVIDER } from '../src/modules/providers/providers.constants';
import { ApiErrorCode } from '@ecoride/contracts';

describe('Authentication & Mock OTP Endpoints (E2E Integration)', () => {
  let app: INestApplication;
  let otpProvider: MockOtpProvider;

  const validTestPhone = '+919988776655';
  const secondPhone = '+919876543211';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENABLE_MOCK_PROVIDERS;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', { exclude: ['health', 'health/(.*)', 'metrics'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    otpProvider = app.get<MockOtpProvider>(OTP_PROVIDER);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    otpProvider.resetForTesting();
  });

  describe('POST /v1/auth/send-otp', () => {
    it('should reject invalid phone format with 400 Bad Request error envelope', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: '9876543210' }) // Missing +91 prefix
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
      expect(response.body.error.message).toContain('Validation failed');
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should reject non-Indian phone numbers with 400 Bad Request', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: '+14155552671' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
    });

    it('should successfully dispatch OTP for valid Indian mobile number', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: validTestPhone, purpose: 'LOGIN' })
        .expect(200);

      expect(response.body.referenceId).toBeDefined();
      expect(response.body.phone).toBe(validTestPhone);
      expect(response.body.expiresAt).toBeDefined();
      expect(response.body.cooldownSeconds).toBe(60);
      expect(response.body.deliveryChannel).toBe('SMS');
    });

    it('should throttle resend within 60 seconds with 429 Too Many Requests (RATE_LIMITED)', async () => {
      // 1. Initial send
      await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: secondPhone })
        .expect(200);

      // 2. Immediate resend within 60 seconds
      const resendResponse = await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: secondPhone })
        .expect(429);

      expect(resendResponse.body.success).toBe(false);
      expect(resendResponse.body.error.code).toBe(ApiErrorCode.RATE_LIMITED);
      expect(resendResponse.body.error.message).toContain('Resend cooldown active');
    });
  });

  describe('POST /v1/auth/verify-otp', () => {
    it('should reject invalid phone format on verification with 400 Bad Request', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: 'invalid-phone', code: '123456' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ApiErrorCode.BAD_REQUEST);
    });

    it('should reject wrong OTP code and return remaining attempts', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: validTestPhone })
        .expect(200);

      // Attempt 1: wrong code
      const response1 = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: validTestPhone, code: '000000' })
        .expect(400);

      expect(response1.body.success).toBe(false);
      expect(response1.body.error.message).toContain('2 attempt(s) remaining');
    });

    it('should enforce lockout after 3 failed attempts with 429 RATE_LIMITED', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: validTestPhone })
        .expect(200);

      // Attempt 1
      await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: validTestPhone, code: '000000' })
        .expect(400);

      // Attempt 2
      await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: validTestPhone, code: '111111' })
        .expect(400);

      // Attempt 3 (triggers lockout)
      const response3 = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: validTestPhone, code: '222222' })
        .expect(429);

      expect(response3.body.success).toBe(false);
      expect(response3.body.error.code).toBe(ApiErrorCode.RATE_LIMITED);
      expect(response3.body.error.message).toContain('Maximum OTP verification attempts exceeded');

      // Attempt 4 (continued lockout)
      const response4 = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: validTestPhone, code: '333333' })
        .expect(429);

      expect(response4.body.success).toBe(false);
      expect(response4.body.error.code).toBe(ApiErrorCode.RATE_LIMITED);
    });

    it('should fail verification when OTP is expired with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: validTestPhone })
        .expect(200);

      const code = otpProvider.getActiveOtpForTesting(validTestPhone, 'LOGIN')!;
      expect(code).toBeDefined();

      // Trigger artificial expiration
      otpProvider.expireOtpForTesting(validTestPhone, 'LOGIN');

      const response = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({ phone: validTestPhone, code })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('OTP has expired');
    });

    it('should verify correct OTP, issue session token, and prevent replay on second attempt', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/send-otp')
        .send({ phone: validTestPhone })
        .expect(200);

      const code = otpProvider.getActiveOtpForTesting(validTestPhone, 'LOGIN')!;
      expect(code).toBeDefined();

      // 1. First verification: success
      const successResponse = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({
          phone: validTestPhone,
          code,
          purpose: 'LOGIN',
          platform: 'RIDER_APP',
        })
        .expect(200);

      expect(successResponse.body.valid).toBe(true);
      expect(successResponse.body.verified).toBe(true);
      expect(successResponse.body.session?.token).toBeDefined();
      expect(successResponse.body.session?.userId).toBeDefined();
      expect(successResponse.body.user?.phone).toBe(validTestPhone);

      // 2. Replay attempt with same code: must fail with 400
      const replayResponse = await request(app.getHttpServer())
        .post('/v1/auth/verify-otp')
        .send({
          phone: validTestPhone,
          code,
          purpose: 'LOGIN',
        })
        .expect(400);

      expect(replayResponse.body.success).toBe(false);
      expect(replayResponse.body.error.message).toContain(
        'OTP not found, expired, or already used',
      );
    });
  });
});
