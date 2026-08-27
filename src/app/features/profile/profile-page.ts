import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { GithubApiService } from '../../core/services/github-api.service';
import { RecentSearchesService } from '../../core/services/recent-searches.service';
import { totalForks as sumForks, totalStars as sumStars } from '../../core/github';
import { ApiError } from '../../core/models/api-error';
import {
  GithubEvent,
  GithubRepo,
  GithubUser,
  LanguageStat,
  RepoSort,
} from '../../core/models/github.models';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { ErrorState } from '../../shared/ui/error-state';
import { EmptyState } from '../../shared/ui/empty-state';
import { RepoCard } from '../../shared/ui/repo-card';
import { LanguageDonut } from '../../shared/ui/language-donut';
import { PullToRefresh } from '../../shared/ui/pull-to-refresh';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

type Status = 'loading' | 'loaded' | 'error';
const PAGE_SIZE = 9;

interface ProfileData {
  readonly user: GithubUser;
  readonly repos: readonly GithubRepo[];
  readonly events: readonly GithubEvent[];
}

@Component({
  selector: 'gs-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Icon,
    Skeleton,
    ErrorState,
    EmptyState,
    RepoCard,
    LanguageDonut,
    CompactNumberPipe,
    RelativeTimePipe,
    PullToRefresh,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  /** Bound from the route param via withComponentInputBinding(). */
  readonly login = input.required<string>();

  /** Mobile pull-to-refresh affordance wrapping the page. */
  private readonly ptr = viewChild(PullToRefresh);

  private readonly api = inject(GithubApiService);
  private readonly recentSvc = inject(RecentSearchesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<Status>('loading');
  protected readonly error = signal<ApiError | null>(null);
  protected readonly user = signal<GithubUser | null>(null);
  protected readonly repos = signal<readonly GithubRepo[]>([]);
  protected readonly events = signal<readonly GithubEvent[]>([]);
  protected readonly languages = signal<readonly LanguageStat[]>([]);

  // ---- Repository controls (client-side) --------------------
  protected readonly filter = signal('');
  protected readonly sort = signal<RepoSort>('stars');
  protected readonly hideForks = signal(false);
  protected readonly visibleCount = signal(PAGE_SIZE);

  protected readonly sortOptions: readonly { value: RepoSort; label: string }[] = [
    { value: 'stars', label: 'Most stars' },
    { value: 'updated', label: 'Recently pushed' },
    { value: 'forks', label: 'Most forks' },
    { value: 'name', label: 'Name (A–Z)' },
  ];

  // ---- Derived aggregates -----------------------------------
  protected readonly totalStars = computed(() => sumStars(this.repos()));
  protected readonly totalForks = computed(() => sumForks(this.repos()));

  protected readonly filteredRepos = computed<readonly GithubRepo[]>(() => {
    const term = this.filter().trim().toLowerCase();
    const hideForks = this.hideForks();
    let list = this.repos().filter((r) => {
      if (hideForks && r.fork) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        (r.description?.toLowerCase().includes(term) ?? false) ||
        (r.language?.toLowerCase().includes(term) ?? false) ||
        r.topics.some((t) => t.includes(term))
      );
    });
    const sort = this.sort();
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'stars':
          return b.stargazers_count - a.stargazers_count;
        case 'forks':
          return b.forks_count - a.forks_count;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
      }
    });
    return list;
  });

  protected readonly visibleRepos = computed(() =>
    this.filteredRepos().slice(0, this.visibleCount()),
  );

  protected readonly hasMore = computed(() => this.visibleCount() < this.filteredRepos().length);

  protected readonly memberSince = computed(() => {
    const u = this.user();
    if (!u) return '';
    return new Date(u.created_at).toLocaleDateString('en', {
      month: 'short',
      year: 'numeric',
    });
  });

  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];

  constructor() {
    // Reload whenever the route login changes.
    effect(() => {
      const login = this.login();
      this.load(login);
    });
  }

  /**
   * The three requests behind a profile view as one stream. The activity feed
   * is optional — a user with no public events (or a 404 on that endpoint)
   * must not take the whole page down with it.
   */
  private fetchProfile(login: string): Observable<ProfileData | { error: ApiError }> {
    return forkJoin({
      user: this.api.getUser(login),
      repos: this.api.getRepos(login, 200),
      events: this.api.getEvents(login).pipe(catchError(() => of([] as GithubEvent[]))),
    }).pipe(
      catchError((err: unknown) => of({ error: err as ApiError })),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private applyProfile(data: ProfileData): void {
    this.user.set(data.user);
    this.repos.set(data.repos);
    this.events.set(data.events);
    this.languages.set(this.api.computeLanguageStats(data.repos));
    this.error.set(null);
    this.status.set('loaded');
  }

  private load(login: string): void {
    this.status.set('loading');
    this.error.set(null);
    this.user.set(null);
    this.repos.set([]);
    this.events.set([]);
    this.languages.set([]);
    this.filter.set('');
    this.visibleCount.set(PAGE_SIZE);

    this.fetchProfile(login).subscribe((result) => {
      if ('error' in result) {
        this.error.set(result.error);
        this.status.set('error');
        return;
      }
      this.applyProfile(result);
      this.recentSvc.add(result.user.login);
    });
  }

  setSort(value: string): void {
    this.sort.set(value as RepoSort);
    this.visibleCount.set(PAGE_SIZE);
  }

  onFilter(value: string): void {
    this.filter.set(value);
    this.visibleCount.set(PAGE_SIZE);
  }

  toggleForks(): void {
    this.hideForks.update((v) => !v);
    this.visibleCount.set(PAGE_SIZE);
  }

  showMore(): void {
    this.visibleCount.update((c) => c + PAGE_SIZE);
  }

  retry(): void {
    this.load(this.login());
  }

  /**
   * Mobile pull-to-refresh: re-fetch the profile without tearing the current
   * view down to skeletons, then retract the pull indicator once settled.
   */
  onRefresh(): void {
    this.fetchProfile(this.login()).subscribe((result) => {
      if (!('error' in result)) {
        this.applyProfile(result);
      } else if (this.user() === null) {
        // Only surface the error state if we have nothing to show.
        this.error.set(result.error);
        this.status.set('error');
      }
      this.ptr()?.done();
    });
  }

  // ---- Activity feed helpers --------------------------------
  eventVerb(event: GithubEvent): string {
    switch (event.type) {
      case 'PushEvent': {
        const n = event.payload.size ?? event.payload.commits?.length ?? 0;
        return `pushed ${n} commit${n === 1 ? '' : 's'} to`;
      }
      case 'PullRequestEvent':
        return `${event.payload.action ?? 'updated'} a pull request in`;
      case 'IssuesEvent':
        return `${event.payload.action ?? 'updated'} an issue in`;
      case 'IssueCommentEvent':
        return 'commented on an issue in';
      case 'WatchEvent':
        return 'starred';
      case 'ForkEvent':
        return 'forked';
      case 'CreateEvent':
        return `created ${event.payload.ref_type ?? 'a ref'} in`;
      case 'DeleteEvent':
        return `deleted ${event.payload.ref_type ?? 'a ref'} in`;
      case 'ReleaseEvent':
        return 'published a release in';
      case 'PublicEvent':
        return 'open-sourced';
      case 'MemberEvent':
        return 'added a collaborator to';
      default:
        return 'interacted with';
    }
  }

  eventIcon(
    event: GithubEvent,
  ): 'commit' | 'pr' | 'issue' | 'star' | 'fork' | 'tag' | 'branch' | 'repo' {
    switch (event.type) {
      case 'PushEvent':
        return 'commit';
      case 'PullRequestEvent':
        return 'pr';
      case 'IssuesEvent':
      case 'IssueCommentEvent':
        return 'issue';
      case 'WatchEvent':
        return 'star';
      case 'ForkEvent':
        return 'fork';
      case 'ReleaseEvent':
        return 'tag';
      case 'CreateEvent':
      case 'DeleteEvent':
        return 'branch';
      default:
        return 'repo';
    }
  }
}
