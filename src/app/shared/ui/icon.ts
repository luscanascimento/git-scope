import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'search'
  | 'star'
  | 'fork'
  | 'eye'
  | 'users'
  | 'user'
  | 'location'
  | 'link'
  | 'building'
  | 'calendar'
  | 'repo'
  | 'code'
  | 'sun'
  | 'moon'
  | 'arrow-right'
  | 'external'
  | 'close'
  | 'clock'
  | 'issue'
  | 'pr'
  | 'commit'
  | 'tag'
  | 'branch'
  | 'compare'
  | 'twitter'
  | 'archive'
  | 'chevron-down'
  | 'sort'
  | 'trash';

/**
 * Inline SVG icon component. Icons are hand-picked to match the
 * developer-tool aesthetic (Octicon-inspired, 16-grid).
 */
@Component({
  selector: 'gs-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('search') {
          <circle cx="7" cy="7" r="4.5" />
          <line x1="10.5" y1="10.5" x2="14" y2="14" />
        }
        @case ('star') {
          <path d="M8 1.5l1.9 3.9 4.3.6-3.1 3 .7 4.2L8 11.2 4.2 13.2l.7-4.2-3.1-3 4.3-.6z" />
        }
        @case ('fork') {
          <circle cx="4" cy="3" r="1.6" />
          <circle cx="12" cy="3" r="1.6" />
          <circle cx="8" cy="13" r="1.6" />
          <path d="M4 4.6v2A2.4 2.4 0 006.4 9h3.2A2.4 2.4 0 0012 6.6v-2M8 9v2.4" />
        }
        @case ('eye') {
          <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" />
          <circle cx="8" cy="8" r="1.8" />
        }
        @case ('users') {
          <circle cx="6" cy="5.5" r="2.4" />
          <path d="M1.5 13.5a4.5 4.5 0 019 0" />
          <path d="M11 3.5a2.4 2.4 0 010 4.6M11.5 13.5a4.5 4.5 0 00-1.6-3.4" />
        }
        @case ('user') {
          <circle cx="8" cy="5" r="2.6" />
          <path d="M2.5 14a5.5 5.5 0 0111 0" />
        }
        @case ('location') {
          <path
            d="M8 1.5c2.5 0 4.5 2 4.5 4.5C12.5 9.5 8 14.5 8 14.5S3.5 9.5 3.5 6C3.5 3.5 5.5 1.5 8 1.5z"
          />
          <circle cx="8" cy="6" r="1.6" />
        }
        @case ('link') {
          <path
            d="M6.5 9.5l3-3M5.5 7.5L4 9a2.1 2.1 0 003 3l1.5-1.5M10.5 8.5L12 7a2.1 2.1 0 00-3-3L7.5 5.5"
          />
        }
        @case ('building') {
          <rect x="3" y="2" width="10" height="12" rx="1" />
          <path d="M6 5h1M9 5h1M6 8h1M9 8h1M7 14v-2h2v2" />
        }
        @case ('calendar') {
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
          <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
        }
        @case ('repo') {
          <path d="M3.5 2.5h8a1 1 0 011 1v10l-2-1.4-2 1.4V2.5" />
          <path d="M3.5 2.5A1.5 1.5 0 002 4v9a1.5 1.5 0 001.5 1.5H11" />
        }
        @case ('code') {
          <path d="M5.5 5L2.5 8l3 3M10.5 5l3 3-3 3M9 3.5l-2 9" />
        }
        @case ('sun') {
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1" />
        }
        @case ('moon') {
          <path d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 106.5 6.5z" />
        }
        @case ('arrow-right') {
          <path d="M2.5 8h11M9 3.5L13.5 8 9 12.5" />
        }
        @case ('external') {
          <path
            d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M11.5 9v3.5A1 1 0 0110.5 13.5h-7A1 1 0 012.5 12.5v-7A1 1 0 013.5 4.5H7"
          />
        }
        @case ('close') {
          <path d="M4 4l8 8M12 4l-8 8" />
        }
        @case ('clock') {
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.5V8l2.5 1.5" />
        }
        @case ('issue') {
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="1.4" />
        }
        @case ('pr') {
          <circle cx="4" cy="4" r="1.6" />
          <circle cx="4" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <path d="M4 5.6v4.8M12 10.4V8a2 2 0 00-2-2H7.5M9 4.5L7 6.5 9 8.5" />
        }
        @case ('commit') {
          <circle cx="8" cy="8" r="2.4" />
          <path d="M8 1.5v4M8 10.5v4" />
        }
        @case ('tag') {
          <path d="M2.5 2.5h5l6 6-5 5-6-6v-5z" />
          <circle cx="5" cy="5" r="1" />
        }
        @case ('branch') {
          <circle cx="4" cy="3.5" r="1.6" />
          <circle cx="4" cy="12.5" r="1.6" />
          <circle cx="12" cy="3.5" r="1.6" />
          <path d="M4 5.1v5.8M12 5.1v1A3.9 3.9 0 018 10H4" />
        }
        @case ('compare') {
          <path d="M8 2v12M4 5.5L2 8l2 2.5M12 5.5L14 8l-2 2.5" />
        }
        @case ('twitter') {
          <path
            d="M14 4.3a5 5 0 01-1.4.4A2.5 2.5 0 0013.7 3a5 5 0 01-1.6.6A2.5 2.5 0 007.8 5.8 7 7 0 012.7 3.2a2.5 2.5 0 00.8 3.3 2.4 2.4 0 01-1.1-.3 2.5 2.5 0 002 2.5 2.5 2.5 0 01-1.1 0 2.5 2.5 0 002.3 1.7A5 5 0 012 11.4a7 7 0 003.8 1.1c4.6 0 7.1-3.8 7.1-7.1v-.3A5 5 0 0014 4.3z"
          />
        }
        @case ('archive') {
          <rect x="2.5" y="3" width="11" height="3" rx="0.5" />
          <path d="M3.5 6v6.5A0.5 0.5 0 004 13h8a0.5 0.5 0 00.5-.5V6M6.5 8.5h3" />
        }
        @case ('chevron-down') {
          <path d="M4 6l4 4 4-4" />
        }
        @case ('sort') {
          <path d="M4 3v10M2 11l2 2 2-2M12 13V3M10 5l2-2 2 2" />
        }
        @case ('trash') {
          <path
            d="M2.5 4h11M5.5 4V2.5h5V4M4 4l.5 9a1 1 0 001 1h5a1 1 0 001-1L12 4M6.5 6.5v5M9.5 6.5v5"
          />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }
    `,
  ],
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(16);
}
