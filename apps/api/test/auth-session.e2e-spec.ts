import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { MockOtpProvider } from '../src/modules/providers/mock/mock-otp.provider';
import { OTP_PROVIDER } from '../src/modules/providers/providers.constants';
import { TokenService } from '../src/modules/auth/token.service';
import { Session } from '../src/database/entities';
import { ACCESS_TOKEN_EXPIRY_SECONDS, ApiErrorCode } from '@ecoride/contracts';

describe('Token & Session Lifecycle E2E Integration (EV-017)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let otpProvider: MockOtpProvider;
  let tokenService: TokenService;
  let sessionRepository: Repository<Session>;

  const phoneRider1 = '+919876500001';
  const phoneRider2 = '+919876500002';

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

    dataSource = app.get(DataSource);
    otpProvider = app.get<MockOtpProvider>(OTP_PROVIDER);
    tokenService = app.get(TokenService);
    sessionRepository = dataSource.getRepository(Session);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    otpProvider.resetForTesting();
  });

  async function loginWithOtp(phone: string, platform = 'RIDER_APP', deviceId = 'dev-e2e-1') {
    otpProvider.clearCooldownForTesting(phone, 'LOGIN');
    await request(app.getHttpServer())
      .post('/v1/auth/send-otp')
      .send({ phone, purpose: 'LOGIN' })
      .expect(200);

    const otp = otpProvider.getActiveOtpForTesting(phone, 'LOGIN')!;

    const verifyRes = await request(app.getHttpServer())
      .post('/v1/auth/verify-otp')
      .send({ phone, code: otp, purpose: 'LOGIN', platform, deviceId })
      .expect(200);

    return verifyRes.body;
  }

  describe('1. Session Issuance & Zero Plaintext Secrets Storage', () => {
    it('should issue 15-minute access token and 30-day rotated refresh token with SHA-256 hash in DB', async () => {
      const loginBody = await loginWithOtp(phoneRider1);

      expect(loginBody.valid).toBe(true);
      expect(loginBody.session).toBeDefined();

      const { accessToken, refreshToken, expiresIn, tokenType, sessionId, userId } =
        loginBody.session;

      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.length).toBe(64); // 64-char hex
      expect(expiresIn).toBe(ACCESS_TOKEN_EXPIRY_SECONDS); // 900s
      expect(tokenType).toBe('Bearer');

      // Verify JWT payload
      const payload = tokenService.verifyAccessToken(accessToken);
      expect(payload.sub).toBe(userId);
      expect(payload.sessionId).toBe(sessionId);
      expect(payload.exp - payload.iat).toBe(ACCESS_TOKEN_EXPIRY_SECONDS);

      // Verify database record
      const sessionInDb = await sessionRepository.findOne({ where: { id: sessionId } });
      expect(sessionInDb).toBeDefined();
      expect(sessionInDb!.isRevoked).toBe(false);

      // Verify token_hash matches SHA-256 of the issued refresh token
      const expectedHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      expect(sessionInDb!.tokenHash).toBe(expectedHash);
      expect(sessionInDb!.previousTokenHash).toBeNull();

      // Verify plaintext refresh token is never stored in DB
      const allSessionsRaw = await dataSource.query(
        `SELECT token_hash, previous_token_hash FROM sessions WHERE id = $1`,
        [sessionId],
      );
      expect(allSessionsRaw[0].token_hash).not.toBe(refreshToken);
      expect(allSessionsRaw[0].token_hash).toBe(expectedHash);
    });
  });

  describe('2. Refresh Token Rotation (RFC 6819)', () => {
    it('should rotate refresh token and advance previousTokenHash', async () => {
      const loginBody = await loginWithOtp(phoneRider1, 'RIDER_APP', 'device-rotation-test');
      const oldRefreshToken = loginBody.session.refreshToken;
      const oldSessionId = loginBody.session.sessionId;
      const oldHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

      const refreshRes = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.refreshToken).toBeDefined();
      expect(refreshRes.body.refreshToken).not.toBe(oldRefreshToken);
      expect(refreshRes.body.expiresIn).toBe(ACCESS_TOKEN_EXPIRY_SECONDS);
      expect(refreshRes.body.tokenType).toBe('Bearer');

      // Verify database state after rotation
      const updatedSession = await sessionRepository.findOne({ where: { id: oldSessionId } });
      expect(updatedSession).toBeDefined();
      expect(updatedSession!.previousTokenHash).toBe(oldHash);

      const newHash = crypto
        .createHash('sha256')
        .update(refreshRes.body.refreshToken)
        .digest('hex');
      expect(updatedSession!.tokenHash).toBe(newHash);
      expect(updatedSession!.isRevoked).toBe(false);
    });
  });

  describe('3. Replay Attack Prevention and Global Session Revocation', () => {
    it('should reject already-rotated refresh token replay and revoke all user sessions', async () => {
      // 1. Initial Login
      const loginBody = await loginWithOtp(phoneRider1, 'RIDER_APP', 'device-replay-test');
      const initialRefreshToken = loginBody.session.refreshToken;
      const userId = loginBody.session.userId;

      // 2. Legitimate rotation: initialRefreshToken -> rotatedRefreshToken
      const rotateRes = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken })
        .expect(200);

      const rotatedRefreshToken = rotateRes.body.refreshToken;
      expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

      // 3. Malicious replay attempt: attacker uses the already-rotated initialRefreshToken
      const replayRes = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken })
        .expect(401);

      expect(replayRes.body.success).toBe(false);
      expect(replayRes.body.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
      expect(replayRes.body.error.message).toContain('Suspected token compromise detected');

      // 4. Verify all sessions for this user were invalidated in the database
      const userSessions = await sessionRepository.find({ where: { userId } });
      expect(userSessions.length).toBeGreaterThan(0);
      for (const s of userSessions) {
        expect(s.isRevoked).toBe(true);
      }

      // 5. Verify the newly rotated token is also rejected now due to compromise revocation
      const postReplayRes = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: rotatedRefreshToken })
        .expect(401);

      expect(postReplayRes.body.error.message).toContain('This session has been revoked');
    });
  });

  describe('4. Logout Lifecycle', () => {
    it('should revoke session on logout and prevent subsequent refresh', async () => {
      // 1. Login
      const loginBody = await loginWithOtp(phoneRider1, 'RIDER_APP', 'device-logout-test');
      const refreshToken = loginBody.session.refreshToken;
      const sessionId = loginBody.session.sessionId;

      // 2. Logout with refreshToken
      const logoutRes = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(logoutRes.body.success).toBe(true);
      expect(logoutRes.body.message).toContain('Logged out successfully');

      // 3. Verify in DB that isRevoked is true
      const sessionInDb = await sessionRepository.findOne({ where: { id: sessionId } });
      expect(sessionInDb!.isRevoked).toBe(true);

      // 4. Subsequent refresh attempt should be rejected with 401
      const refreshAfterLogout = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(refreshAfterLogout.body.error.message).toContain('This session has been revoked');
    });
  });

  describe('5. Session Listing & Privacy (Never Leaking Secrets)', () => {
    it('should return session list with safe metadata and omit hashes or secrets', async () => {
      const loginBody = await loginWithOtp(phoneRider1, 'RIDER_APP', 'pixel-phone-99');
      const accessToken = loginBody.session.accessToken;
      const currentSessionId = loginBody.session.sessionId;

      const sessionsRes = await request(app.getHttpServer())
        .get('/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(sessionsRes.body)).toBe(true);
      expect(sessionsRes.body.length).toBeGreaterThan(0);

      const foundCurrent = sessionsRes.body.find(
        (s: Record<string, unknown>) => s.id === currentSessionId,
      );
      expect(foundCurrent).toBeDefined();
      expect(foundCurrent.platform).toBe('RIDER_APP');
      expect(foundCurrent.deviceId).toBe('pixel-phone-99');
      expect(foundCurrent.isCurrent).toBe(true);
      expect(foundCurrent.isRevoked).toBe(false);

      // Privacy checks: token secrets & hashes must never leak in API responses
      for (const s of sessionsRes.body) {
        expect(s.tokenHash).toBeUndefined();
        expect(s.token_hash).toBeUndefined();
        expect(s.previousTokenHash).toBeUndefined();
        expect(s.previous_token_hash).toBeUndefined();
        expect(s.rawToken).toBeUndefined();
      }
    });

    it('should reject unauthenticated request to /v1/auth/sessions', async () => {
      const res = await request(app.getHttpServer()).get('/v1/auth/sessions').expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
    });
  });

  describe('6. Cross-Account Isolation (Access to Other Users Sessions Fails)', () => {
    it('should prevent User A from accessing User B sessions with 403 Forbidden', async () => {
      const userA = await loginWithOtp(phoneRider1, 'RIDER_APP', 'device-user-a');
      const userB = await loginWithOtp(phoneRider2, 'RIDER_APP', 'device-user-b');

      const userAId = userA.session.userId;
      const userBId = userB.session.userId;
      const userAToken = userA.session.accessToken;

      // 1. User A can view own sessions
      await request(app.getHttpServer())
        .get(`/v1/identity/users/${userAId}/sessions`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      // 2. User A cannot view User B sessions
      const forbiddenRes = await request(app.getHttpServer())
        .get(`/v1/identity/users/${userBId}/sessions`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(403);

      expect(forbiddenRes.body.success).toBe(false);
      expect(forbiddenRes.body.error.code).toBe(ApiErrorCode.FORBIDDEN);
      expect(forbiddenRes.body.error.message).toContain('Access denied');
    });
  });

  describe('7. Global Session Revocation via Endpoint', () => {
    it('should revoke all sessions for authenticated actor on /v1/auth/revoke-all', async () => {
      // Create session 1
      const session1 = await loginWithOtp(phoneRider1, 'RIDER_APP', 'device-global-1');
      // Create session 2
      const session2 = await loginWithOtp(phoneRider1, 'WEB', 'browser-global-2');

      const token1 = session1.session.accessToken;
      const refreshToken1 = session1.session.refreshToken;
      const refreshToken2 = session2.session.refreshToken;

      // Revoke all sessions using token1
      const revokeRes = await request(app.getHttpServer())
        .post('/v1/auth/revoke-all')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(revokeRes.body.success).toBe(true);
      expect(revokeRes.body.revokedCount).toBeGreaterThanOrEqual(1);

      // Both refresh tokens should now fail
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(401);

      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: refreshToken2 })
        .expect(401);
    });
  });
});
