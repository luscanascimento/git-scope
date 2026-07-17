import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

/** Neutral empty-state placeholder. */
@Component({
  selector: 'gs-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="empty">
      <div class="empty__icon" aria-hidden="true">
        <gs-icon [name]="icon()" [size]="24" />
      </div>
      <h3 class="empty__title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty__msg">{{ message() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--space-2);
        padding: var(--space-8) var(--space-5);
        max-width: 440px;
        margin-inline: auto;
      }
      .empty__icon {
        width: 64px;
        height: 64px;
        display: grid;
        place-items: center;
        border-radius: var(--radius-lg);
        background: var(--bg-raised);
        border: 1px solid var(--border-default);
        color: var(--text-muted);
        margin-bottom: var(--space-2);
      }
      .empty__title {
        font-size: var(--text-md);
      }
      .empty__msg {
        color: var(--text-muted);
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class EmptyState {
  readonly icon = input<IconName>('search');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}
