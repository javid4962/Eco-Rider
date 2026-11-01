import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';
import { ApiErrorCode, ApiErrorEnvelope, ApiErrorDetail } from '@ecoride/contracts';
import {
  RequestWithCorrelation,
  CORRELATION_ID_HEADER,
} from '../middleware/correlation-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelation>();

    // 1. Resolve Correlation ID
    const correlationId =
      request.correlationId ||
      (typeof request.headers?.[CORRELATION_ID_HEADER] === 'string'
        ? request.headers[CORRELATION_ID_HEADER]
        : null) ||
      randomUUID();

    // 2. Resolve Status Code
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ApiErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let messageKey: string | undefined;
    let details: ApiErrorDetail[] | string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      code = this.mapStatusToErrorCode(status);

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;

        // Custom error code override if provided in exception
        if (typeof resObj.code === 'string') {
          code = resObj.code;
        }

        // Custom response-message identifier if provided
        if (typeof resObj.messageKey === 'string') {
          messageKey = resObj.messageKey;
        }

        if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else if (Array.isArray(resObj.message)) {
          // NestJS ValidationPipe returns an array of messages
          message = 'Validation failed';
          details = resObj.message as string[];
        }

        if (
          resObj.details &&
          (Array.isArray(resObj.details) || typeof resObj.details === 'object')
        ) {
          details = resObj.details as ApiErrorDetail[];
        }
      }
    } else {
      // Internal unhandled error: log full stack trace securely on the server
      const errorMsg = exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`[${correlationId}] Unhandled server exception: ${errorMsg}`, stack);
      // Ensure zero leakage of stack trace or system paths to client
    }

    const errorEnvelope: ApiErrorEnvelope = {
      success: false,
      error: {
        code,
        message,
        ...(messageKey ? { messageKey } : {}),
        ...(details ? { details } : {}),
      },
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url || '',
    };

    // Ensure correlation header is echoed back on error response
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    response.status(status).json(errorEnvelope);
  }

  private mapStatusToErrorCode(status: number): ApiErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ApiErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ApiErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ApiErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ApiErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ApiErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ApiErrorCode.UNPROCESSABLE_ENTITY;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ApiErrorCode.RATE_LIMITED;
      default:
        return status >= 500 ? ApiErrorCode.INTERNAL_SERVER_ERROR : ApiErrorCode.BAD_REQUEST;
    }
  }
}
