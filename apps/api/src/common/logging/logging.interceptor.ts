import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { LogSanitizer } from './log-sanitizer';
import {
  CORRELATION_ID_HEADER,
  RequestWithCorrelation,
} from '../middleware/correlation-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<RequestWithCorrelation>();
    const res = httpCtx.getResponse<Response>();

    const correlationId =
      req.correlationId ||
      (typeof req.headers?.[CORRELATION_ID_HEADER] === 'string'
        ? req.headers[CORRELATION_ID_HEADER]
        : 'unknown-corr');
    const method = req.method;
    const url = LogSanitizer.sanitizeString(req.originalUrl || req.url);
    const startTime = Date.now();

    // Redact body before logging
    const sanitizedBody =
      req.body && Object.keys(req.body).length > 0 ? LogSanitizer.sanitize(req.body) : undefined;

    const requestLogPayload = {
      event: 'HTTP_REQUEST_START',
      correlationId,
      method,
      url,
      body: sanitizedBody,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(JSON.stringify(requestLogPayload));

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startTime;
          const statusCode = res.statusCode;

          const responseLogPayload = {
            event: 'HTTP_REQUEST_FINISH',
            correlationId,
            method,
            url,
            statusCode,
            durationMs,
            timestamp: new Date().toISOString(),
          };

          this.logger.log(JSON.stringify(responseLogPayload));
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - startTime;
          const sanitizedError = LogSanitizer.sanitize(err);

          const errorLogPayload = {
            event: 'HTTP_REQUEST_ERROR',
            correlationId,
            method,
            url,
            durationMs,
            error: sanitizedError,
            timestamp: new Date().toISOString(),
          };

          this.logger.error(JSON.stringify(errorLogPayload));
        },
      }),
    );
  }
}
