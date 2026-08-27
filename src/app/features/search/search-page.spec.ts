import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SearchPage } from './search-page';

const SEARCH_URL = 'https://api.github.com/search/users';

/** The debounce applied to the typed-input branch of the query stream. */
const DEBOUNCE = 350;

describe('SearchPage', () => {
  let fixture: ComponentFixture<SearchPage>;
  let page: SearchPage;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(SearchPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Types a term and lets the debounce elapse. */
  function search(term: string): void {
    page.query.setValue(term);
    tick(DEBOUNCE);
  }

  it('issues one request for a typed term', fakeAsync(() => {
    search('octocat');

    const req = httpMock.expectOne((r) => r.url === SEARCH_URL);
    expect(req.request.params.get('q')).toBe('octocat');
    req.flush({ total_count: 0, incomplete_results: false, items: [] });
  }));

  it('re-issues the request when retry() runs after a failure', fakeAsync(() => {
    search('octocat');
    httpMock
      .expectOne((r) => r.url === SEARCH_URL)
      .flush(null, { status: 500, statusText: 'Server Error' });

    // The term has not changed: a naive setValue('') / setValue(term) round trip
    // is swallowed by distinctUntilChanged and fires nothing.
    page.retry();
    tick(DEBOUNCE);

    const retryReq = httpMock.expectOne((r) => r.url === SEARCH_URL);
    expect(retryReq.request.params.get('q')).toBe('octocat');
    retryReq.flush({ total_count: 0, incomplete_results: false, items: [] });
  }));

  it('clears previous results when the term drops below the 2-char floor', fakeAsync(() => {
    search('octocat');
    httpMock
      .expectOne((r) => r.url === SEARCH_URL)
      .flush({
        total_count: 42,
        incomplete_results: false,
        items: [{ id: 1, login: 'octocat', avatar_url: '', html_url: '', type: 'User' }],
      });
    expect(page['status']()).toBe('loaded');

    // Backspacing down to one character is not searched — but the octocat hits
    // must not stay on screen next to a query that no longer matches them.
    search('o');

    expect(httpMock.match(() => true).length).toBe(0);
    expect(page['status']()).toBe('idle');
    expect(page['results']()).toEqual([]);
    expect(page['totalCount']()).toBe(0);
  }));

  it('does not request anything when retry() runs with an empty query', fakeAsync(() => {
    page.retry();
    tick(DEBOUNCE);

    expect(httpMock.match(() => true).length).toBe(0);
  }));
});
