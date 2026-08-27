/** Discriminated, UI-friendly error surface for GitHub API failures. */
export type ApiErrorKind = 'not-found' | 'rate-limit' | 'forbidden' | 'network' | 'unknown';

export class ApiError {
  constructor(
    readonly kind: ApiErrorKind,
    readonly title: string,
    readonly message: string,
    readonly status: number | null = null,
    /** Unix timestamp (seconds) at which the rate limit resets, when known. */
    readonly retryAt: number | null = null,
  ) {}

  get isRateLimit(): boolean {
    return this.kind === 'rate-limit';
  }
}
