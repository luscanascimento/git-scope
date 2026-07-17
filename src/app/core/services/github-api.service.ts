import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import {
  GithubEvent,
  GithubRepo,
  GithubUser,
  LanguageStat,
  UserSearchResponse,
  UserSnapshot,
} from '../models/github.models';
import { languageColor } from './language-color';

const BASE = 'https://api.github.com';

/** All repositories are fetched in pages of this size (GitHub max is 100). */
const REPO_PAGE_SIZE = 100;

/**
 * Thin, typed wrapper around the public GitHub REST API plus a few
 * derived aggregations (language distribution, comparison snapshots).
 */
@Injectable({ providedIn: 'root' })
export class GithubApiService {
  private readonly http = inject(HttpClient);

  searchUsers(query: string, perPage = 12): Observable<UserSearchResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('per_page', perPage)
      .set('sort', 'followers')
      .set('order', 'desc');
    return this.http.get<UserSearchResponse>(`${BASE}/search/users`, { params });
  }

  getUser(login: string): Observable<GithubUser> {
    return this.http.get<GithubUser>(`${BASE}/users/${encodeURIComponent(login)}`);
  }

  /**
   * Fetches up to `maxRepos` of a user's public repositories, following
   * pagination. Capped to keep unauthenticated request usage reasonable.
   */
  getRepos(login: string, maxRepos = 200): Observable<GithubRepo[]> {
    const pages = Math.ceil(maxRepos / REPO_PAGE_SIZE);
    const requests: Observable<GithubRepo[]>[] = [];
    for (let page = 1; page <= pages; page++) {
      const params = new HttpParams()
        .set('per_page', REPO_PAGE_SIZE)
        .set('page', page)
        .set('sort', 'updated');
      requests.push(
        this.http.get<GithubRepo[]>(
          `${BASE}/users/${encodeURIComponent(login)}/repos`,
          { params },
        ),
      );
    }
    return forkJoin(requests).pipe(
      map((chunks) => chunks.flat().slice(0, maxRepos)),
    );
  }

  getEvents(login: string, perPage = 30): Observable<GithubEvent[]> {
    const params = new HttpParams().set('per_page', perPage);
    return this.http.get<GithubEvent[]>(
      `${BASE}/users/${encodeURIComponent(login)}/events/public`,
      { params },
    );
  }

  /** Aggregates a repository list into a sorted language distribution. */
  computeLanguageStats(repos: readonly GithubRepo[]): LanguageStat[] {
    const counts = new Map<string, number>();
    for (const repo of repos) {
      if (repo.fork || !repo.language) continue;
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return [...counts.entries()]
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / total) * 100,
        color: languageColor(language),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /** Builds a full comparison snapshot (profile + derived aggregates). */
  getSnapshot(login: string): Observable<UserSnapshot> {
    return forkJoin({
      user: this.getUser(login),
      repos: this.getRepos(login, 200),
    }).pipe(
      map(({ user, repos }) => {
        const owned = repos.filter((r) => !r.fork);
        const totalStars = owned.reduce((s, r) => s + r.stargazers_count, 0);
        const totalForks = owned.reduce((s, r) => s + r.forks_count, 0);
        const topRepo =
          owned.length > 0
            ? owned.reduce((best, r) =>
                r.stargazers_count > best.stargazers_count ? r : best,
              )
            : null;
        return {
          user,
          totalStars,
          totalForks,
          languages: this.computeLanguageStats(repos),
          topRepo,
        } satisfies UserSnapshot;
      }),
    );
  }
}
