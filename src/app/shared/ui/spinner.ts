import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Minimal terminal-style loading spinner. */
@Component({
  selector: 'gs-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="spinner" [style.--s.px]="size()" role="status" aria-live="polite">
      <span class="visually-hidden">{{ label() }}</span>
    </span>
  `,
  styles: [
    `
      .spinner {
        display: inline-block;
        width: var(--s);
        height: var(--s);
        border-radius: 50%;
        border: 2px solid var(--border-strong);
        border-top-color: var(--accent);
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class Spinner {
  readonly size = input(20);
  readonly label = input('Loading');
}
