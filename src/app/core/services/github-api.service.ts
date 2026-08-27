import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, forkJoin, map, reduce } from 'rxjs';
import {
  GithubEvent,
  GithubRepo,
  GithubUser,
  LanguageStat,
  UserSearchResponse,
  UserSnapshot,
} from '../models/github.models';
import { ownedRepos, totalForks, totalStars } from '../github';
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
   * Fetches up to `maxRepos` of a user's public repositories.
   *
   * Pages are requested one at a time and the walk stops as soon as a page
   * comes back short (fewer than {@link REPO_PAGE_SIZE} items), which means
   * the common case — a user with under 100 repositories — costs a single
   * request instead of burning the whole 60/hour unauthenticated budget.
   */
  getRepos(login: string, maxRepos = 200): Observable<GithubRepo[]> {
    const maxPages = Math.ceil(maxRepos / REPO_PAGE_SIZE);
    return this.getRepoPage(login, 1).pipe(
      expand((repos, i) => {
        const nextPage = i + 2;
        const isLastPage = repos.length < REPO_PAGE_SIZE;
        return isLastPage || nextPage > maxPages ? EMPTY : this.getRepoPage(login, nextPage);
      }),
      reduce((all: GithubRepo[], chunk) => all.concat(chunk), []),
      map((all) => all.slice(0, maxRepos)),
    );
  }

  private getRepoPage(login: string, page: number): Observable<GithubRepo[]> {
    const params = new HttpParams()
      .set('per_page', REPO_PAGE_SIZE)
      .set('page', page)
      .set('sort', 'updated');
    return this.http.get<GithubRepo[]>(`${BASE}/users/${encodeURIComponent(login)}/repos`, {
      params,
    });
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
        const owned = ownedRepos(repos);
        const topRepo =
          owned.length > 0
            ? owned.reduce((best, r) => (r.stargazers_count > best.stargazers_count ? r : best))
            : null;
        return {
          user,
          totalStars: totalStars(repos),
          totalForks: totalForks(repos),
          languages: this.computeLanguageStats(repos),
          topRepo,
        } satisfies UserSnapshot;
      }),
    );
  }
}
