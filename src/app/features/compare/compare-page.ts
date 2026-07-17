import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { GithubApiService } from '../../core/services/github-api.service';
import { ApiError } from '../../core/models/api-error';
import { UserSnapshot } from '../../core/models/github.models';
import { Icon } from '../../shared/ui/icon';
import { Spinner } from '../../shared/ui/spinner';
import { ErrorState } from '../../shared/ui/error-state';
import { CompactNumberPipe } from '../../shared/pipes/compact-number.pipe';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

interface Metric {
  readonly label: string;
  readonly icon: 'star' | 'fork' | 'users' | 'repo' | 'user';
  readonly a: number;
  readonly b: number;
}

@Component({
  selector: 'gs-compare-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    Icon,
    Spinner,
    ErrorState,
    CompactNumberPipe,
  ],
  templateUrl: './compare-page.html',
  styleUrl: './compare-page.scss',
})
export class ComparePage {
  private readonly api = inject(GithubApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  private static readonly NAME = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

  readonly form = new FormGroup({
    a: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(ComparePage.NAME)],
    }),
    b: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(ComparePage.NAME)],
    }),
  });

  protected readonly status = signal<Status>('idle');
  protected readonly error = signal<ApiError | null>(null);
  protected readonly snapA = signal<UserSnapshot | null>(null);
  protected readonly snapB = signal<UserSnapshot | null>(null);

  protected readonly metrics = computed<Metric[]>(() => {
    const a = this.snapA();
    const b = this.snapB();
    if (!a || !b) return [];
    return [
      { label: 'Followers', icon: 'users', a: a.user.followers, b: b.user.followers },
      { label: 'Public repos', icon: 'repo', a: a.user.public_repos, b: b.user.public_repos },
      { label: 'Total stars', icon: 'star', a: a.totalStars, b: b.totalStars },
      { label: 'Total forks', icon: 'fork', a: a.totalForks, b: b.totalForks },
      { label: 'Following', icon: 'user', a: a.user.following, b: b.user.following },
    ];
  });

  /** Overall winner by count of metrics won. */
  protected readonly verdict = computed<'a' | 'b' | 'tie' | null>(() => {
    const m = this.metrics();
    if (m.length === 0) return null;
    let aWins = 0;
    let bWins = 0;
    for (const metric of m) {
      if (metric.a > metric.b) aWins++;
      else if (metric.b > metric.a) bWins++;
    }
    if (aWins === bWins) return 'tie';
    return aWins > bWins ? 'a' : 'b';
  });

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const a = params.get('a');
    const b = params.get('b');
    if (a) this.form.controls.a.setValue(a);
    if (b) this.form.controls.b.setValue(b);
    if (a && b && this.form.valid) {
      this.compare();
    }
  }

  compare(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { a, b } = this.form.getRawValue();
    this.status.set('loading');
    this.error.set(null);
    this.snapA.set(null);
    this.snapB.set(null);

    forkJoin({
      a: this.api.getSnapshot(a.trim()),
      b: this.api.getSnapshot(b.trim()),
    })
      .pipe(
        catchError((err: unknown) => of({ error: err as ApiError })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.error.set(result.error);
          this.status.set('error');
          return;
        }
        this.snapA.set(result.a);
        this.snapB.set(result.b);
        this.status.set('loaded');
      });
  }

  swap(): void {
    const { a, b } = this.form.getRawValue();
    this.form.setValue({ a: b, b: a });
    if (this.form.valid) this.compare();
  }

  barWidth(value: number, other: number): string {
    const max = Math.max(value, other, 1);
    return `${Math.max((value / max) * 100, 3)}%`;
  }

  invalid(control: 'a' | 'b'): boolean {
    const c = this.form.controls[control];
    return c.invalid && (c.touched || c.dirty);
  }

  retry(): void {
    this.compare();
  }
}
