import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ACCESS_TOKEN_EXPIRY_SECONDS } from '@ecoride/contracts';

export interface AccessTokenPayload {
  sub: string; // User UUID
  role: string;
  scopes: string[];
  sessionId: string;
  iat: number; // Unix epoch seconds
  exp: number; // Unix epoch seconds
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly accessTokenTtlSeconds = ACCESS_TOKEN_EXPIRY_SECONDS; // 900 seconds (15 min)

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      process.env.JWT_SECRET ||
      'ecoride_ev_secure_jwt_token_secret_ap_pilot_2026';
  }

  /**
   * Generates a signed, short-lived JWT access token (15 minutes).
   */
  generateAccessToken(payload: {
    sub: string;
    role: string;
    scopes: string[];
    sessionId: string;
  }): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: AccessTokenPayload = {
      ...payload,
      iat: now,
      exp: now + this.accessTokenTtlSeconds,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = this.signHmac(`${header}.${body}`);

    return `${header}.${body}.${signature}`;
  }

  /**
   * Verifies and decodes a JWT access token using constant-time signature validation.
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed token');
    }

    const [header, body, signature] = parts;
    const expectedSignature = this.signHmac(`${header}.${body}`);

    // Constant-time signature verification to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      throw new UnauthorizedException('Invalid token signature');
    }

    try {
      const payload: AccessTokenPayload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf-8'),
      );
      const now = Math.floor(Date.now() / 1000);

      if (!payload.exp || now > payload.exp) {
        throw new UnauthorizedException('Token has expired');
      }

      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Failed to parse token payload');
    }
  }

  /**
   * Generates a 64-character cryptographically secure random refresh token secret.
   * This plaintext secret is delivered to the client ONCE and NEVER stored in the database.
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Computes a SHA-256 digest of the refresh token for zero-plaintext database storage.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  private signHmac(data: string): string {
    return crypto.createHmac('sha256', this.jwtSecret).update(data).digest('base64url');
  }
}
