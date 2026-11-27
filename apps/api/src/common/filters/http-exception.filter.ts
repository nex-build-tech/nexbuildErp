import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Catches HttpExceptions and formats them into the standard error envelope:
 * { success: false, error: { code, message, details } }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    let details: Record<string, string[]> | string | undefined;
    let code = `HTTP_${status}`;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      message = (resp['message'] as string) ?? message;
      code = (resp['error'] as string) ?? code;
      // class-validator validation errors come as an array
      if (Array.isArray(resp['message'])) {
        details = { validation: resp['message'] as string[] };
        message = 'Validation failed';
      }
    }

    this.logger.warn(
      `[${request.method}] ${request.url} → ${status}: ${message}`,
    );

    response.status(status).json({
      success: false,
      error: {
        code: code.toUpperCase().replace(/\s+/g, '_'),
        message,
        ...(details !== undefined ? { details } : {}),
      },
    });
  }
}
