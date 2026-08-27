import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProfilePage } from './profile-page';
import { GithubEvent, GithubRepo, RepoSort } from '../../core/models/github.models';

function repo(patch: Partial<GithubRepo> & { name: string }): GithubRepo {
  return {
    id: patch.name.length,
    full_name: `octocat/${patch.name}`,
    html_url: '',
    description: null,
    fork: false,
    archived: false,
    language: null,
    stargazers_count: 0,
    watchers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    topics: [],
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
    pushed_at: '2020-01-01T00:00:00Z',
    homepage: null,
    license: null,
    ...patch,
  };
}

describe('ProfilePage', () => {
  let fixture: ComponentFixture<ProfilePage>;
  let page: ProfilePage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    // Deliberately no detectChanges(): the load effect would fire real
    // requests, and every assertion here is on pure derived state.
    fixture = TestBed.createComponent(ProfilePage);
    page = fixture.componentInstance;
  });

  /** Seeds the repository list and reads the derived, filtered+sorted view. */
  function names(repos: readonly GithubRepo[]): readonly string[] {
    page['repos'].set(repos);
    return page['filteredRepos']().map((r) => r.name);
  }

  describe('filteredRepos()', () => {
    const list = [
      repo({
        name: 'zeta',
        stargazers_count: 5,
        forks_count: 1,
        pushed_at: '2024-01-01T00:00:00Z',
      }),
      repo({
        name: 'alpha',
        stargazers_count: 50,
        forks_count: 0,
        pushed_at: '2022-01-01T00:00:00Z',
      }),
      repo({
        name: 'mid',
        stargazers_count: 10,
        forks_count: 9,
        pushed_at: '2026-01-01T00:00:00Z',
      }),
    ];

    it('sorts by stars, forks, name and recent push', () => {
      const bySort: Record<RepoSort, readonly string[]> = {
        stars: ['alpha', 'mid', 'zeta'],
        forks: ['mid', 'zeta', 'alpha'],
        name: ['alpha', 'mid', 'zeta'],
        updated: ['mid', 'zeta', 'alpha'],
      };
      for (const [sort, expected] of Object.entries(bySort)) {
        page['sort'].set(sort as RepoSort);
        expect(names(list)).withContext(`sort=${sort}`).toEqual(expected);
      }
    });

    it('matches the term against name, description, language and topics', () => {
      const searchable = [
        repo({ name: 'hit-by-name' }),
        repo({ name: 'b', description: 'a NEEDLE in prose' }),
        repo({ name: 'c', language: 'Needlescript' }),
        repo({ name: 'd', topics: ['needle-tools'] }),
        repo({ name: 'e', description: 'unrelated' }),
      ];

      page['filter'].set('needle');
      page['sort'].set('name');
      expect(names(searchable)).toEqual(['b', 'c', 'd']);

      page['filter'].set('hit-by');
      expect(names(searchable)).toEqual(['hit-by-name']);
    });

    it('drops forks only while the hide-forks toggle is on', () => {
      const mixed = [repo({ name: 'own' }), repo({ name: 'forked', fork: true })];
      page['sort'].set('name');

      expect(names(mixed)).toEqual(['forked', 'own']);

      page['hideForks'].set(true);
      expect(names(mixed)).toEqual(['own']);
    });
  });

  describe('eventVerb()', () => {
    it('pluralises the push count and falls back to the commit array', () => {
      const push = (payload: GithubEvent['payload']) =>
        page.eventVerb({
          id: '1',
          type: 'PushEvent',
          actor: { login: 'octocat', avatar_url: '' },
          repo: { id: 1, name: 'octocat/hello' },
          created_at: '2024-01-01T00:00:00Z',
          payload,
        });

      expect(push({ size: 1 })).toBe('pushed 1 commit to');
      expect(push({ size: 3 })).toBe('pushed 3 commits to');
      expect(
        push({
          commits: [
            { message: 'a', sha: '1' },
            { message: 'b', sha: '2' },
          ],
        }),
      ).toBe('pushed 2 commits to');
      expect(push({})).toBe('pushed 0 commits to');
    });
  });
});
