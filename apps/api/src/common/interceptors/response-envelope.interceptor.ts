import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '@builderp/shared';

/**
 * Wraps every successful controller response in the standard envelope:
 * { success: true, data: <original response>, meta?: ... }
 *
 * Controllers can bypass this by returning an already-enveloped object
 * (i.e. one that already has `success: true`).
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the controller already returned an envelope, pass it through.
        if (
          data !== null &&
          typeof data === 'object' &&
          'success' in (data as object) &&
          (data as Record<string, unknown>)['success'] === true
        ) {
          return data as unknown as ApiResponse<T>;
        }

        return {
          success: true as const,
          data,
        };
      }),
    );
  }
}
