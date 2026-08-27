import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiError } from '../models/api-error';
import { githubErrorInterceptor } from './github-error.interceptor';

const GITHUB_URL = 'https://api.github.com/users/octocat';

describe('githubErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([githubErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Fires a GET and returns whatever the stream errors with. */
  function failWith(
    respond: (req: ReturnType<HttpTestingController['expectOne']>) => void,
    url = GITHUB_URL,
  ): unknown {
    let caught: unknown;
    http.get(url).subscribe({ error: (e: unknown) => (caught = e) });
    respond(httpMock.expectOne(url));
    return caught;
  }

  it('maps 403 with x-ratelimit-remaining: 0 to a rate-limit error', () => {
    const err = failWith((req) =>
      req.flush('rate limited', {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'x-ratelimit-remaining': '0' },
      }),
    );

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).kind).toBe('rate-limit');
    expect((err as ApiError).isRateLimit).toBeTrue();
    expect((err as ApiError).status).toBe(403);
  });

  it('captures x-ratelimit-reset as a numeric retryAt', () => {
    const err = failWith((req) =>
      req.flush('rate limited', {
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1750000000',
        },
      }),
    ) as ApiError;

    expect(err.retryAt).toBe(1750000000);
  });

  it('leaves retryAt null when the reset header is absent', () => {
    const err = failWith((req) =>
      req.flush('rate limited', {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'x-ratelimit-remaining': '0' },
      }),
    ) as ApiError;

    expect(err.retryAt).toBeNull();
  });

  it('maps 429 with x-ratelimit-remaining: 0 to a rate-limit error', () => {
    const err = failWith((req) =>
      req.flush('slow down', {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'x-ratelimit-remaining': '0' },
      }),
    ) as ApiError;

    expect(err.kind).toBe('rate-limit');
    expect(err.status).toBe(429);
  });

  it('maps 403 without the rate-limit header to forbidden, not rate-limit', () => {
    const err = failWith((req) =>
      req.flush('nope', { status: 403, statusText: 'Forbidden' }),
    ) as ApiError;

    expect(err.kind).toBe('forbidden');
    expect(err.isRateLimit).toBeFalse();
  });

  it('maps 403 with remaining budget left to forbidden', () => {
    const err = failWith((req) =>
      req.flush('nope', {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'x-ratelimit-remaining': '57' },
      }),
    ) as ApiError;

    expect(err.kind).toBe('forbidden');
  });

  it('maps 404 to not-found', () => {
    const err = failWith((req) =>
      req.flush('missing', { status: 404, statusText: 'Not Found' }),
    ) as ApiError;

    expect(err.kind).toBe('not-found');
    expect(err.status).toBe(404);
    expect(err.retryAt).toBeNull();
  });

  it('maps 422 to an invalid-query error', () => {
    const err = failWith((req) =>
      req.flush('bad query', { status: 422, statusText: 'Unprocessable Entity' }),
    ) as ApiError;

    expect(err.kind).toBe('unknown');
    expect(err.title).toBe('Invalid query');
    expect(err.status).toBe(422);
  });

  it('maps status 0 (offline) to a network error', () => {
    const err = failWith((req) =>
      req.error(new ProgressEvent('error'), { status: 0, statusText: '' }),
    ) as ApiError;

    expect(err.kind).toBe('network');
    expect(err.status).toBe(0);
  });

  it('falls back to unknown for unexpected statuses', () => {
    const err = failWith((req) =>
      req.flush('boom', { status: 500, statusText: 'Server Error' }),
    ) as ApiError;

    expect(err.kind).toBe('unknown');
    expect(err.status).toBe(500);
    expect(err.message).toContain('500');
  });

  it('passes non-GitHub failures through untouched', () => {
    const url = 'https://example.com/health';
    const err = failWith((req) => req.flush('down', { status: 404, statusText: 'Not Found' }), url);

    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect(err).not.toBeInstanceOf(ApiError);
  });
});
