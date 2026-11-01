import * as crypto from 'crypto';
import { TokenService } from '../src/modules/auth/token.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { PlatformRole, ACCESS_TOKEN_EXPIRY_SECONDS } from '@ecoride/contracts';

describe('TokenService (EV-017)', () => {
  let tokenService: TokenService;
  const mockConfigService = {
    get: jest.fn().mockReturnValue('test_jwt_secret_key_12345'),
  } as unknown as ConfigService;

  beforeEach(() => {
    tokenService = new TokenService(mockConfigService);
  });

  describe('generateAccessToken & verifyAccessToken', () => {
    const payload = {
      sub: 'a0000001-0000-0000-0000-000000000001',
      role: PlatformRole.RIDER,
      scopes: ['rider:self', 'booking:create'],
      sessionId: 's0000001-0000-0000-0000-000000000001',
    };

    it('should generate a valid 3-part base64url JWT with 15-minute expiry', () => {
      const token = tokenService.generateAccessToken(payload);
      expect(typeof token).toBe('string');

      const parts = token.split('.');
      expect(parts.length).toBe(3);

      const decoded = tokenService.verifyAccessToken(token);
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.scopes).toEqual(payload.scopes);
      expect(decoded.sessionId).toBe(payload.sessionId);
      expect(decoded.exp - decoded.iat).toBe(ACCESS_TOKEN_EXPIRY_SECONDS); // 900s
    });

    it('should reject tampered token with invalid signature', () => {
      const token = tokenService.generateAccessToken(payload);
      const parts = token.split('.');

      // Tamper with payload (elevate role to SUPER_ADMIN)
      const tamperedPayload = Buffer.from(
        JSON.stringify({
          ...payload,
          role: PlatformRole.SUPER_ADMIN,
          exp: Math.floor(Date.now() / 1000) + 900,
        }),
      ).toString('base64url');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      expect(() => tokenService.verifyAccessToken(tamperedToken)).toThrow(UnauthorizedException);
    });

    it('should reject expired access token', () => {
      // Craft expired token directly
      const expiredPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000) - 1000,
        exp: Math.floor(Date.now() / 1000) - 100, // Expired 100 seconds ago
      };

      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
        'base64url',
      );
      const body = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
      const secret = 'test_jwt_secret_key_12345';
      const sig = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');
      const expiredToken = `${header}.${body}.${sig}`;

      expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow(UnauthorizedException);
    });

    it('should reject malformed token strings', () => {
      expect(() => tokenService.verifyAccessToken('')).toThrow(UnauthorizedException);
      expect(() => tokenService.verifyAccessToken('invalid.token')).toThrow(UnauthorizedException);
      expect(() => tokenService.verifyAccessToken('a.b.c.d')).toThrow(UnauthorizedException);
    });
  });

  describe('generateRefreshToken & hashToken', () => {
    it('should generate high-entropy 64-character hex refresh token secret', () => {
      const token1 = tokenService.generateRefreshToken();
      const token2 = tokenService.generateRefreshToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('should produce SHA-256 digest ensuring zero plaintext storage in database', () => {
      const rawToken = 'my_raw_secret_refresh_token_123';
      const hash1 = tokenService.hashToken(rawToken);
      const hash2 = tokenService.hashToken(rawToken);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2); // Deterministic hash
      expect(hash1).not.toBe(rawToken); // Not plaintext
    });
  });
});
