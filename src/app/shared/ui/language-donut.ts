import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { LanguageStat } from '../../core/models/github.models';
import { CompactNumberPipe } from '../pipes/compact-number.pipe';

interface Arc {
  readonly stat: LanguageStat;
  readonly dasharray: string;
  readonly dashoffset: number;
}

const RADIUS = 60;
const CIRC = 2 * Math.PI * RADIUS;
const MAX_SLICES = 8;

/**
 * DIFFERENTIAL — animated donut chart of a user's language distribution,
 * aggregated across their non-forked repositories. Interactive legend
 * highlights the corresponding arc.
 */
@Component({
  selector: 'gs-language-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompactNumberPipe, DecimalPipe],
  template: `
    <div class="donut">
      <div class="donut__chart">
        <svg viewBox="0 0 150 150" role="img" [attr.aria-label]="ariaLabel()">
          <circle
            class="donut__track"
            cx="75"
            cy="75"
            [attr.r]="radius"
          />
          @for (arc of arcs(); track arc.stat.language; let i = $index) {
            <circle
              class="donut__arc"
              [class.donut__arc--dim]="active() !== null && active() !== arc.stat.language"
              cx="75"
              cy="75"
              [attr.r]="radius"
              [attr.stroke]="arc.stat.color"
              [attr.stroke-dasharray]="arc.dasharray"
              [attr.stroke-dashoffset]="arc.dashoffset"
              [style.animation-delay.ms]="i * 90"
              (mouseenter)="active.set(arc.stat.language)"
              (mouseleave)="active.set(null)"
            />
          }
        </svg>
        <div class="donut__center">
          @if (focused(); as f) {
            <span class="donut__pct mono">{{ f.percentage | number: '1.0-0' }}%</span>
            <span class="donut__label">{{ f.language }}</span>
          } @else {
            <span class="donut__pct mono">{{ total() }}</span>
            <span class="donut__label">repos typed</span>
          }
        </div>
      </div>

      <ul class="donut__legend">
        @for (arc of arcs(); track arc.stat.language) {
          <li
            class="donut__item"
            tabindex="0"
            [attr.aria-label]="
              arc.stat.language + ': ' + (arc.stat.percentage | number: '1.0-0') + '%'
            "
            [class.donut__item--active]="active() === arc.stat.language"
            (mouseenter)="active.set(arc.stat.language)"
            (mouseleave)="active.set(null)"
            (focus)="active.set(arc.stat.language)"
            (blur)="active.set(null)"
          >
            <span class="donut__swatch" [style.background]="arc.stat.color"></span>
            <span class="donut__name">{{ arc.stat.language }}</span>
            <span class="donut__count mono">{{ arc.stat.count | compactNumber }}</span>
            <span class="donut__share mono">{{ arc.stat.percentage | number: '1.0-0' }}%</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      .donut {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--space-6);
        align-items: center;
      }
      @media (max-width: 560px) {
        .donut {
          grid-template-columns: 1fr;
          justify-items: center;
        }
      }
      .donut__chart {
        position: relative;
        width: 190px;
        height: 190px;
      }
      svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }
      .donut__track {
        fill: none;
        stroke: var(--bg-inset);
        stroke-width: 14;
      }
      .donut__arc {
        fill: none;
        stroke-width: 14;
        stroke-linecap: round;
        transition:
          opacity var(--dur-fast) var(--ease-out),
          stroke-width var(--dur-fast) var(--ease-out);
        animation: sweep 0.9s var(--ease-out) both;
        cursor: pointer;
      }
      .donut__arc:hover {
        stroke-width: 17;
      }
      .donut__arc--dim {
        opacity: 0.28;
      }
      @keyframes sweep {
        from {
          stroke-dasharray: 0 999;
        }
      }
      .donut__center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        pointer-events: none;
      }
      .donut__pct {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--text-primary);
      }
      .donut__label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: lowercase;
        letter-spacing: var(--tracking-wide);
      }
      .donut__legend {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
      }
      .donut__item {
        display: grid;
        grid-template-columns: 12px 1fr auto auto;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-sm);
        transition: background var(--dur-fast) var(--ease-out);
        cursor: default;
      }
      .donut__item--active {
        background: var(--bg-hover);
      }
      .donut__item:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
      .donut__swatch {
        width: 10px;
        height: 10px;
        border-radius: 3px;
      }
      .donut__name {
        font-size: var(--text-sm);
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .donut__count {
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
      .donut__share {
        font-size: var(--text-xs);
        color: var(--text-secondary);
        min-width: 34px;
        text-align: right;
      }
    `,
  ],
})
export class LanguageDonut {
  readonly stats = input.required<readonly LanguageStat[]>();
  protected readonly active = signal<string | null>(null);

  protected readonly radius = RADIUS;

  /** Top slices; the remainder is folded into a single "Other" arc. */
  private readonly slices = computed<LanguageStat[]>(() => {
    const stats = this.stats();
    if (stats.length <= MAX_SLICES) return [...stats];
    const head = stats.slice(0, MAX_SLICES - 1);
    const tail = stats.slice(MAX_SLICES - 1);
    const otherCount = tail.reduce((s, l) => s + l.count, 0);
    const otherPct = tail.reduce((s, l) => s + l.percentage, 0);
    return [
      ...head,
      { language: 'Other', count: otherCount, percentage: otherPct, color: '#8a94a6' },
    ];
  });

  protected readonly total = computed(() =>
    this.stats().reduce((s, l) => s + l.count, 0),
  );

  protected readonly arcs = computed<Arc[]>(() => {
    let cumulative = 0;
    return this.slices().map((stat) => {
      const len = (stat.percentage / 100) * CIRC;
      const gap = CIRC - len;
      const arc: Arc = {
        stat,
        dasharray: `${Math.max(len - 2, 0)} ${gap + 2}`,
        dashoffset: -cumulative,
      };
      cumulative += len;
      return arc;
    });
  });

  protected readonly focused = computed<LanguageStat | null>(() => {
    const name = this.active();
    if (!name) return null;
    return this.slices().find((s) => s.language === name) ?? null;
  });

  protected readonly ariaLabel = computed(() => {
    const top = this.stats()
      .slice(0, 3)
      .map((s) => `${s.language} ${Math.round(s.percentage)}%`)
      .join(', ');
    return `Language distribution: ${top}`;
  });
}
