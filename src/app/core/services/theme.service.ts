import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'git-scope:theme';

/** Browser-chrome colour per theme — mirrors `--bg-base` in the design tokens. */
const THEME_COLOR: Record<Theme, string> = {
  dark: '#0b0e14',
  light: '#f6f8fb',
};

/** Persists and applies the light/dark theme via the `data-theme` attribute. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    effect(() => {
      const value = this.theme();
      document.documentElement.setAttribute('data-theme', value);
      this.syncThemeColor(value);
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        /* storage unavailable — ignore */
      }
    });
  }

  /**
   * Keep the browser chrome (address bar / status bar / PWA header) colour in
   * step with the active theme. Media-scoped `theme-color` metas from index.html
   * still cover first paint; here we override with a single active meta so the
   * colour tracks the in-app toggle rather than the OS preference.
   */
  private syncThemeColor(value: Theme): void {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', THEME_COLOR[value]);
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initial(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      /* ignore */
    }
    const prefersLight =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }
}
