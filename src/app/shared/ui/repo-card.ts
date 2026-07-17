import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GithubRepo } from '../../core/models/github.models';
import { languageColor } from '../../core/services/language-color';
import { CompactNumberPipe } from '../pipes/compact-number.pipe';
import { RelativeTimePipe } from '../pipes/relative-time.pipe';
import { Icon } from './icon';

/** A single repository card in the profile repository list. */
@Component({
  selector: 'gs-repo-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, CompactNumberPipe, RelativeTimePipe],
  template: `
    <article class="repo">
      <div class="repo__head">
        <a
          class="repo__name"
          [href]="repo().html_url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <gs-icon name="repo" [size]="15" />
          <span>{{ repo().name }}</span>
          <gs-icon name="external" [size]="12" />
        </a>
        @if (repo().archived) {
          <span class="repo__flag repo__flag--archived">
            <gs-icon name="archive" [size]="11" /> archived
          </span>
        }
        @if (repo().fork) {
          <span class="repo__flag"><gs-icon name="fork" [size]="11" /> fork</span>
        }
      </div>

      @if (repo().description) {
        <p class="repo__desc">{{ repo().description }}</p>
      } @else {
        <p class="repo__desc repo__desc--muted">No description provided.</p>
      }

      @if (repo().topics.length) {
        <ul class="repo__topics">
          @for (topic of repo().topics.slice(0, 4); track topic) {
            <li class="repo__topic mono">{{ topic }}</li>
          }
        </ul>
      }

      <footer class="repo__meta">
        @if (repo().language) {
          <span class="repo__lang">
            <span class="repo__dot" [style.background]="langColor()"></span>
            {{ repo().language }}
          </span>
        }
        <span class="repo__stat" title="Stars">
          <gs-icon name="star" [size]="13" />
          {{ repo().stargazers_count | compactNumber }}
        </span>
        <span class="repo__stat" title="Forks">
          <gs-icon name="fork" [size]="13" />
          {{ repo().forks_count | compactNumber }}
        </span>
        @if (repo().open_issues_count > 0) {
          <span class="repo__stat" title="Open issues">
            <gs-icon name="issue" [size]="13" />
            {{ repo().open_issues_count | compactNumber }}
          </span>
        }
        <span class="repo__updated mono" title="Last updated">
          {{ repo().pushed_at | relativeTime }}
        </span>
      </footer>
    </article>
  `,
  styles: [
    `
      .repo {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-5);
        height: 100%;
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        transition:
          transform var(--dur-fast) var(--ease-out),
          border-color var(--dur-fast) var(--ease-out),
          box-shadow var(--dur-fast) var(--ease-out);
        position: relative;
        overflow: hidden;
      }
      .repo::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 2px;
        background: linear-gradient(90deg, var(--accent), transparent);
        opacity: 0;
        transition: opacity var(--dur-fast) var(--ease-out);
      }
      .repo:hover {
        transform: translateY(-3px);
        border-color: var(--border-strong);
        box-shadow: var(--shadow-md);
      }
      .repo:hover::before {
        opacity: 1;
      }
      /* Touch tap feedback (no hover on touch devices). */
      @media (hover: none) {
        .repo:active {
          transform: scale(0.99);
          border-color: var(--border-strong);
        }
        .repo__name gs-icon:last-child {
          opacity: 0.6;
        }
      }
      .repo__head {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .repo__name {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        font-family: var(--font-mono);
        font-weight: 600;
        font-size: var(--text-base);
        color: var(--text-primary);
        transition: color var(--dur-fast) var(--ease-out);
      }
      .repo__name:hover {
        color: var(--accent);
      }
      .repo__name gs-icon:last-child {
        opacity: 0;
        transition: opacity var(--dur-fast) var(--ease-out);
        color: var(--text-muted);
      }
      .repo__name:hover gs-icon:last-child {
        opacity: 1;
      }
      .repo__flag {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: var(--text-xs);
        color: var(--text-muted);
        padding: 1px var(--space-2);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-pill);
      }
      .repo__flag--archived {
        color: var(--warn);
        border-color: color-mix(in srgb, var(--warn) 40%, transparent);
      }
      .repo__desc {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        line-height: var(--leading-normal);
        flex: 1;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .repo__desc--muted {
        color: var(--text-faint);
        font-style: italic;
      }
      .repo__topics {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }
      .repo__topic {
        font-size: var(--text-xs);
        color: var(--cyan);
        background: color-mix(in srgb, var(--cyan) 12%, transparent);
        padding: 2px var(--space-2);
        border-radius: var(--radius-pill);
      }
      .repo__meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-4);
        margin-top: auto;
        padding-top: var(--space-2);
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
      .repo__lang {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--text-secondary);
      }
      .repo__dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
      }
      .repo__stat {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .repo__updated {
        margin-left: auto;
        color: var(--text-faint);
      }
    `,
  ],
})
export class RepoCard {
  readonly repo = input.required<GithubRepo>();
  protected readonly langColor = computed(() => languageColor(this.repo().language));
}
