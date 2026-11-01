import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformRole, ROLE_SCOPES } from '@ecoride/contracts';

export interface CurrentActorPayload {
  id: string;
  role: PlatformRole | string;
  scopes: string[];
  ipAddress?: string;
  correlationId?: string;
}

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentActorPayload => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers || {};

    const actorId =
      (headers['x-actor-user-id'] as string) ||
      request.user?.id ||
      '00000000-0000-0000-0000-000000000000';
    const actorRole = (headers['x-actor-role'] as string) || request.user?.role || 'ANONYMOUS';

    const scopes = ROLE_SCOPES[actorRole] || [];
    const ipAddress = request.ip || (headers['x-forwarded-for'] as string) || '127.0.0.1';
    const correlationId = request.correlationId || (headers['x-correlation-id'] as string);

    return {
      id: actorId,
      role: actorRole,
      scopes,
      ipAddress,
      correlationId,
    };
  },
);
