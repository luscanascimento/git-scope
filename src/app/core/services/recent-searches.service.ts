import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'git-scope:recent';
const MAX = 8;

/** Persists the most recently viewed usernames in localStorage. */
@Injectable({ providedIn: 'root' })
export class RecentSearchesService {
  private readonly _recent = signal<readonly string[]>(this.load());
  readonly recent = this._recent.asReadonly();

  add(login: string): void {
    const normalized = login.trim();
    if (!normalized) return;
    const next = [
      normalized,
      ...this._recent().filter((l) => l.toLowerCase() !== normalized.toLowerCase()),
    ].slice(0, MAX);
    this._recent.set(next);
    this.persist(next);
  }

  remove(login: string): void {
    const next = this._recent().filter((l) => l !== login);
    this._recent.set(next);
    this.persist(next);
  }

  clear(): void {
    this._recent.set([]);
    this.persist([]);
  }

  private load(): readonly string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX);
      }
    } catch {
      /* ignore malformed storage */
    }
    return [];
  }

  private persist(value: readonly string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }
}
