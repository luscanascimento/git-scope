import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ApiError } from '../../core/models/api-error';
import { Icon } from './icon';

/** Friendly, specific error panel driven by an {@link ApiError}. */
@Component({
  selector: 'gs-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="err" role="alert" [class.err--rate]="error().isRateLimit">
      <div class="err__glyph mono" aria-hidden="true">{{ glyph() }}</div>
      <h3 class="err__title">{{ error().title }}</h3>
      <p class="err__msg">{{ error().message }}</p>

      @if (error().isRateLimit && countdown()) {
        <p class="err__reset mono">resets {{ countdown() }}</p>
      }

      @if (showRetry()) {
        <button type="button" class="err__retry" (click)="retry.emit()">
          <gs-icon name="arrow-right" [size]="14" />
          Try again
        </button>
      }
    </div>
  `,
  styles: [
    `
      .err {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--space-3);
        padding: var(--space-8) var(--space-5);
        max-width: 520px;
        margin-inline: auto;
      }
      .err__glyph {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--danger);
        background: var(--danger-bg);
        width: 84px;
        height: 84px;
        display: grid;
        place-items: center;
        border-radius: var(--radius-lg);
        border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
      }
      .err--rate .err__glyph {
        color: var(--warn);
        background: var(--warn-bg);
        border-color: color-mix(in srgb, var(--warn) 30%, transparent);
      }
      .err__title {
        font-size: var(--text-lg);
        margin-top: var(--space-2);
      }
      .err__msg {
        color: var(--text-secondary);
        line-height: var(--leading-normal);
      }
      .err__reset {
        font-size: var(--text-sm);
        color: var(--text-muted);
        padding: var(--space-1) var(--space-3);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-pill);
      }
      .err__retry {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-2);
        padding: var(--space-2) var(--space-5);
        border-radius: var(--radius-pill);
        background: var(--bg-raised);
        border: 1px solid var(--border-strong);
        color: var(--text-primary);
        font-weight: 600;
        transition: all var(--dur-fast) var(--ease-out);
      }
      .err__retry:hover {
        border-color: var(--accent);
        color: var(--accent);
        transform: translateY(-1px);
      }
    `,
  ],
})
export class ErrorState {
  readonly error = input.required<ApiError>();
  readonly showRetry = input(true);
  readonly retry = output<void>();

  protected readonly glyph = computed(() => {
    switch (this.error().kind) {
      case 'not-found':
        return '404';
      case 'rate-limit':
        return '429';
      case 'forbidden':
        return '403';
      case 'network':
        return '⚡';
      default:
        return '!';
    }
  });

  protected readonly countdown = computed(() => {
    const at = this.error().retryAt;
    if (!at) return '';
    const rel = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const seconds = Math.max(0, at - Math.floor(Date.now() / 1000));
    if (seconds < 60) return rel.format(seconds, 'seconds');
    return rel.format(Math.round(seconds / 60), 'minutes');
  });
}
