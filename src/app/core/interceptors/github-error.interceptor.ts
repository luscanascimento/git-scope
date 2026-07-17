import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api-error';

/**
 * Translates raw HttpErrorResponses from api.github.com into friendly,
 * specific {@link ApiError} instances the UI can render directly.
 */
export const githubErrorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('api.github.com')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }
      return throwError(() => toApiError(err));
    }),
  );
};

function toApiError(err: HttpErrorResponse): ApiError {
  const remaining = err.headers?.get('x-ratelimit-remaining');
  const resetHeader = err.headers?.get('x-ratelimit-reset');
  const retryAt = resetHeader ? Number(resetHeader) : null;

  // Rate limiting: GitHub returns 403 (or 429) with remaining = 0.
  if ((err.status === 403 || err.status === 429) && remaining === '0') {
    return new ApiError(
      'rate-limit',
      'API rate limit reached',
      'GitHub limits unauthenticated requests to 60 per hour. Please wait a moment before trying again — the counter resets automatically.',
      err.status,
      retryAt,
    );
  }

  switch (err.status) {
    case 404:
      return new ApiError(
        'not-found',
        'Not found',
        "We couldn't find anything matching that on GitHub. Double-check the username or spelling and try again.",
        404,
      );
    case 403:
      return new ApiError(
        'forbidden',
        'Access forbidden',
        'GitHub declined this request. This usually happens when the hourly request budget is exhausted.',
        403,
        retryAt,
      );
    case 422:
      return new ApiError(
        'unknown',
        'Invalid query',
        'That search query could not be processed. Try simplifying your search terms.',
        422,
      );
    case 0:
      return new ApiError(
        'network',
        'Network error',
        'We could not reach GitHub. Check your internet connection and try again.',
        0,
      );
    default:
      return new ApiError(
        'unknown',
        'Something went wrong',
        `GitHub responded with an unexpected error (HTTP ${err.status}). Please try again shortly.`,
        err.status,
      );
  }
}
