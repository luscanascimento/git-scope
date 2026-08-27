import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { Icon } from './icon';

/**
 * Touch-only pull-to-refresh affordance. Wraps content and emits `refresh`
 * when the user pulls down past a threshold while scrolled to the very top.
 *
 * Design notes:
 * - Only arms on touch pointers so desktop mouse/trackpad is untouched.
 * - Only tracks a gesture that *starts* at documentElement scrollTop 0, so it
 *   never hijacks normal in-page scrolling.
 * - Uses passive listeners and never calls preventDefault, so it can't break
 *   native momentum scrolling; the browser's own overscroll is complemented,
 *   not replaced.
 * - Honours prefers-reduced-motion by skipping the elastic indicator animation.
 */
@Component({
  selector: 'gs-pull-to-refresh',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="ptr__indicator"
      [class.is-armed]="armed()"
      [class.is-refreshing]="refreshing()"
      [style.height.px]="pull()"
      aria-hidden="true"
    >
      <span class="ptr__spinner" [style.transform]="'rotate(' + pull() * 2 + 'deg)'">
        <gs-icon name="sort" [size]="18" />
      </span>
    </div>
    <ng-content />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ptr__indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        height: 0;
        color: var(--text-muted);
        transition: height var(--dur-fast) var(--ease-out);
      }
      .ptr__indicator.is-armed {
        color: var(--accent);
      }
      .ptr__spinner {
        display: inline-flex;
      }
      .ptr__indicator.is-refreshing .ptr__spinner {
        animation: ptr-spin 0.7s linear infinite;
      }
      @keyframes ptr-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ptr__indicator {
          transition: none;
        }
      }
    `,
  ],
  host: {
    '(touchstart)': 'onStart($event)',
    '(touchmove)': 'onMove($event)',
    '(touchend)': 'onEnd()',
    '(touchcancel)': 'onEnd()',
  },
})
export class PullToRefresh {
  /** Emitted when the user completes a pull-to-refresh gesture. */
  readonly refresh = output<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pull = signal(0);
  protected readonly armed = signal(false);
  protected readonly refreshing = signal(false);

  private startY = 0;
  private tracking = false;
  private retract: ReturnType<typeof setTimeout> | null = null;

  private static readonly THRESHOLD = 72;
  private static readonly MAX = 96;
  private static readonly RESIST = 0.5;

  constructor() {
    this.destroyRef.onDestroy(() => this.reset());
  }

  protected onStart(event: TouchEvent): void {
    if (this.refreshing()) return;
    // Only arm when the page is genuinely at the top.
    if (this.scrollTop() > 0) return;
    this.tracking = true;
    this.startY = event.touches[0]?.clientY ?? 0;
  }

  protected onMove(event: TouchEvent): void {
    if (!this.tracking || this.refreshing()) return;
    const y = event.touches[0]?.clientY ?? 0;
    const delta = y - this.startY;
    if (delta <= 0 || this.scrollTop() > 0) {
      this.pull.set(0);
      this.armed.set(false);
      return;
    }
    const dist = Math.min(delta * PullToRefresh.RESIST, PullToRefresh.MAX);
    this.pull.set(dist);
    this.armed.set(dist >= PullToRefresh.THRESHOLD);
  }

  protected onEnd(): void {
    if (!this.tracking) return;
    this.tracking = false;
    if (this.armed()) {
      this.refreshing.set(true);
      this.pull.set(48);
      this.armed.set(false);
      this.refresh.emit();
      // Auto-retract as a safety net if the parent forgets to call done().
      // One timer at a time: rapid pulls must not stack them.
      this.clearRetract();
      this.retract = setTimeout(() => this.done(), 6000);
    } else {
      this.reset();
    }
  }

  /** Parent calls this once the refresh work has settled. */
  done(): void {
    this.refreshing.set(false);
    this.reset();
  }

  private reset(): void {
    this.clearRetract();
    this.pull.set(0);
    this.armed.set(false);
  }

  private clearRetract(): void {
    if (this.retract !== null) {
      clearTimeout(this.retract);
      this.retract = null;
    }
  }

  private scrollTop(): number {
    return document.scrollingElement?.scrollTop ?? document.documentElement.scrollTop ?? 0;
  }
}
