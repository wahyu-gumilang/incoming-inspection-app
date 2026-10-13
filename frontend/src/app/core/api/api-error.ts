import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, ApiErrorDetail } from '../models/api-response';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static from(err: unknown): ApiError {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as ApiErrorBody | undefined;
      if (body?.error) {
        return new ApiError(
          err.status,
          body.error.code,
          body.error.message,
          body.error.details ?? [],
        );
      }
      // Non-JSON error or unexpected shape
      return new ApiError(err.status, 'UNKNOWN_ERROR', err.statusText || 'Unknown error');
    }
    if (err instanceof ApiError) return err;
    return new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }
}
