import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GithubRepo } from '../models/github.models';
import { GithubApiService } from './github-api.service';

const REPOS_URL = 'https://api.github.com/users/octocat/repos';

function repo(id: number): GithubRepo {
  return {
    id,
    name: `repo-${id}`,
    full_name: `octocat/repo-${id}`,
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
    created_at: '',
    updated_at: '',
    pushed_at: '',
    homepage: null,
    license: null,
  };
}

function page(size: number, offset = 0): GithubRepo[] {
  return Array.from({ length: size }, (_, i) => repo(offset + i));
}

describe('GithubApiService.getRepos', () => {
  let api: GithubApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(GithubApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('stops after one request when the first page is short', () => {
    let result: GithubRepo[] | undefined;
    api.getRepos('octocat').subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url === REPOS_URL).flush(page(3));

    expect(result?.length).toBe(3);
    expect(httpMock.match(() => true).length).toBe(0);
  });

  it('requests a second page only when the first one is full', () => {
    let result: GithubRepo[] | undefined;
    api.getRepos('octocat').subscribe((r) => (result = r));

    const first = httpMock.expectOne((r) => r.url === REPOS_URL);
    expect(first.request.params.get('page')).toBe('1');
    first.flush(page(100));

    const second = httpMock.expectOne((r) => r.url === REPOS_URL);
    expect(second.request.params.get('page')).toBe('2');
    second.flush(page(20, 100));

    expect(result?.length).toBe(120);
  });

  it('never walks past the page budget implied by maxRepos', () => {
    let result: GithubRepo[] | undefined;
    api.getRepos('octocat', 200).subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url === REPOS_URL).flush(page(100));
    httpMock.expectOne((r) => r.url === REPOS_URL).flush(page(100, 100));

    expect(result?.length).toBe(200);
    expect(httpMock.match(() => true).length).toBe(0);
  });
});
