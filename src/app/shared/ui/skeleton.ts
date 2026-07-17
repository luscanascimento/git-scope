import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shimmering placeholder block used while async data loads. */
@Component({
  selector: 'gs-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="sk"
    [style.width]="width()"
    [style.height]="height()"
    [style.border-radius]="radius()"
    aria-hidden="true"
  ></span>`,
  styles: [
    `
      .sk {
        display: block;
        background: linear-gradient(
          100deg,
          var(--bg-raised) 30%,
          var(--bg-hover) 50%,
          var(--bg-raised) 70%
        );
        background-size: 220% 100%;
        animation: shimmer 1.4s ease-in-out infinite;
      }
      @keyframes shimmer {
        from {
          background-position: 180% 0;
        }
        to {
          background-position: -80% 0;
        }
      }
    `,
  ],
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('16px');
  readonly radius = input('6px');
}
