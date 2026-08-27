import { GithubRepo } from './models/github.models';

/**
 * Shared GitHub domain rules and derived aggregates, so the route guard, the
 * compare form and the profile/snapshot aggregates cannot drift apart.
 */

/** GitHub username rules: alphanumeric or single hyphens, max 39 chars. */
export const USERNAME_RE = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

/** Repositories the user actually owns — forks are excluded from every aggregate. */
export function ownedRepos(repos: readonly GithubRepo[]): readonly GithubRepo[] {
  return repos.filter((r) => !r.fork);
}

/** Total stars across owned (non-fork) repositories. */
export function totalStars(repos: readonly GithubRepo[]): number {
  return ownedRepos(repos).reduce((sum, r) => sum + r.stargazers_count, 0);
}

/** Total forks across owned (non-fork) repositories. */
export function totalForks(repos: readonly GithubRepo[]): number {
  return ownedRepos(repos).reduce((sum, r) => sum + r.forks_count, 0);
}
