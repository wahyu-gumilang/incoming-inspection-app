import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody, ApiErrorDetail } from '../models/api-response';

// What every failed API call turns into, so components never parse HttpErrorResponse.
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
    if (err instanceof ApiError) return err;
    if (err instanceof HttpErrorResponse) {
      const body = err.error as Partial<ApiErrorBody> | null;
      if (body && body.success === false && body.error) {
        return new ApiError(
          err.status,
          body.error.code,
          body.error.message,
          body.error.details ?? [],
        );
      }
      if (err.status === 0)
        return new ApiError(0, 'NETWORK', 'The server can’t be reached. Check your connection.');
      return new ApiError(err.status, 'HTTP_' + err.status, err.statusText || 'Request failed');
    }
    return new ApiError(0, 'UNKNOWN', 'Something went wrong');
  }

  // The message for one form field, if the server named it in error.details.
  fieldMessage(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message;
  }
}
