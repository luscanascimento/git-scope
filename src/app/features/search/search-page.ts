import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
} from 'rxjs';
import { GithubApiService } from '../../core/services/github-api.service';
import { RecentSearchesService } from '../../core/services/recent-searches.service';
import { ApiError } from '../../core/models/api-error';
import { UserSearchResult } from '../../core/models/github.models';
import { Icon } from '../../shared/ui/icon';
import { Spinner } from '../../shared/ui/spinner';
import { ErrorState } from '../../shared/ui/error-state';
import { EmptyState } from '../../shared/ui/empty-state';
import { Skeleton } from '../../shared/ui/skeleton';

type Status = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';

@Component({
  selector: 'gs-search-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    Icon,
    Spinner,
    ErrorState,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
})
export class SearchPage {
  private readonly api = inject(GithubApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly recentSvc = inject(RecentSearchesService);

  readonly query = new FormControl<string>('', { nonNullable: true });

  protected readonly status = signal<Status>('idle');
  protected readonly results = signal<readonly UserSearchResult[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly recent = this.recentSvc.recent;

  protected readonly suggestions = [
    'torvalds',
    'gaearon',
    'sindresorhus',
    'addyosmani',
  ];

  constructor() {
    this.query.valueChanges
      .pipe(
        map((v) => v.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        filter((v) => {
          if (v.length === 0) {
            this.status.set('idle');
            this.results.set([]);
            this.error.set(null);
            return false;
          }
          return v.length >= 2;
        }),
        switchMap((v) => {
          this.status.set('loading');
          this.error.set(null);
          return this.api.searchUsers(v).pipe(
            map((res) => ({ ok: true as const, res })),
            catchError((err: unknown) =>
              of({ ok: false as const, err: err as ApiError }),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => {
        if (!outcome.ok) {
          this.error.set(outcome.err);
          this.status.set('error');
          return;
        }
        this.results.set(outcome.res.items);
        this.totalCount.set(outcome.res.total_count);
        this.status.set(outcome.res.items.length === 0 ? 'empty' : 'loaded');
      });
  }

  openProfile(login: string): void {
    this.recentSvc.add(login);
    void this.router.navigate(['/u', login]);
  }

  useSuggestion(login: string): void {
    this.query.setValue(login);
  }

  removeRecent(event: Event, login: string): void {
    event.stopPropagation();
    this.recentSvc.remove(login);
  }

  clearRecent(): void {
    this.recentSvc.clear();
  }

  retry(): void {
    const value = this.query.value.trim();
    this.query.setValue('');
    this.query.setValue(value);
  }
}
