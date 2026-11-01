import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../token.service';

export interface AuthenticatedUser {
  id: string;
  role: string;
  scopes: string[];
  sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  correlationId?: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const payload = this.tokenService.verifyAccessToken(token);
        req.user = {
          id: payload.sub,
          role: payload.role,
          scopes: payload.scopes,
          sessionId: payload.sessionId,
        };
      } catch {
        // Token invalid or expired - leave req.user undefined; guards can reject if protected
      }
    }

    next();
  }
}
