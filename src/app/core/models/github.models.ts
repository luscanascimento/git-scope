/**
 * Type definitions for the subset of the GitHub REST API used by Git Scope.
 * https://docs.github.com/en/rest
 */

export interface GithubUser {
  readonly login: string;
  readonly id: number;
  readonly avatar_url: string;
  readonly html_url: string;
  readonly name: string | null;
  readonly company: string | null;
  readonly blog: string | null;
  readonly location: string | null;
  readonly email: string | null;
  readonly bio: string | null;
  readonly twitter_username: string | null;
  readonly public_repos: number;
  readonly public_gists: number;
  readonly followers: number;
  readonly following: number;
  readonly created_at: string;
  readonly type: string;
}

export interface UserSearchResult {
  readonly login: string;
  readonly id: number;
  readonly avatar_url: string;
  readonly html_url: string;
  readonly type: string;
}

export interface UserSearchResponse {
  readonly total_count: number;
  readonly incomplete_results: boolean;
  readonly items: readonly UserSearchResult[];
}

export interface GithubRepo {
  readonly id: number;
  readonly name: string;
  readonly full_name: string;
  readonly html_url: string;
  readonly description: string | null;
  readonly fork: boolean;
  readonly archived: boolean;
  readonly language: string | null;
  readonly stargazers_count: number;
  readonly watchers_count: number;
  readonly forks_count: number;
  readonly open_issues_count: number;
  readonly topics: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
  readonly pushed_at: string;
  readonly homepage: string | null;
  readonly license: { readonly spdx_id: string | null; readonly name: string } | null;
}

export type GithubEventType =
  | 'PushEvent'
  | 'PullRequestEvent'
  | 'IssuesEvent'
  | 'IssueCommentEvent'
  | 'WatchEvent'
  | 'ForkEvent'
  | 'CreateEvent'
  | 'DeleteEvent'
  | 'PublicEvent'
  | 'ReleaseEvent'
  | 'CommitCommentEvent'
  | 'MemberEvent'
  | string;

export interface GithubEvent {
  readonly id: string;
  readonly type: GithubEventType;
  readonly actor: { readonly login: string; readonly avatar_url: string };
  readonly repo: { readonly id: number; readonly name: string };
  readonly created_at: string;
  readonly payload: {
    readonly action?: string;
    readonly ref?: string;
    readonly ref_type?: string;
    readonly size?: number;
    readonly commits?: readonly { readonly message: string; readonly sha: string }[];
    readonly pull_request?: { readonly title: string; readonly number: number };
    readonly issue?: { readonly title: string; readonly number: number };
    readonly release?: { readonly tag_name: string; readonly name: string | null };
  };
}

/** Normalised aggregate of a language across a user's repositories. */
export interface LanguageStat {
  readonly language: string;
  readonly count: number;
  readonly percentage: number;
  readonly color: string;
}

/** Snapshot used by the comparison feature. */
export interface UserSnapshot {
  readonly user: GithubUser;
  readonly totalStars: number;
  readonly totalForks: number;
  readonly languages: readonly LanguageStat[];
  readonly topRepo: GithubRepo | null;
}

export type RepoSort = 'updated' | 'stars' | 'name' | 'forks';
