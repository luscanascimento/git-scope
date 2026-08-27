import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ComparePage } from './compare-page';
import { UserSnapshot } from '../../core/models/github.models';

interface Counts {
  followers: number;
  public_repos: number;
  following: number;
  totalStars: number;
  totalForks: number;
}

function snapshot(login: string, counts: Counts): UserSnapshot {
  return {
    user: {
      login,
      id: 1,
      avatar_url: '',
      html_url: '',
      name: null,
      company: null,
      blog: null,
      location: null,
      email: null,
      bio: null,
      twitter_username: null,
      public_repos: counts.public_repos,
      public_gists: 0,
      followers: counts.followers,
      following: counts.following,
      created_at: '2020-01-01T00:00:00Z',
      type: 'User',
    },
    totalStars: counts.totalStars,
    totalForks: counts.totalForks,
    languages: [],
    topRepo: null,
  };
}

const ZERO: Counts = {
  followers: 0,
  public_repos: 0,
  following: 0,
  totalStars: 0,
  totalForks: 0,
};

describe('ComparePage', () => {
  let fixture: ComponentFixture<ComparePage>;
  let page: ComparePage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ComparePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(ComparePage);
    page = fixture.componentInstance;
  });

  function compare(a: Partial<Counts>, b: Partial<Counts>): 'a' | 'b' | 'tie' | null {
    page['snapA'].set(snapshot('a', { ...ZERO, ...a }));
    page['snapB'].set(snapshot('b', { ...ZERO, ...b }));
    return page['verdict']();
  }

  describe('verdict()', () => {
    it('is null until both snapshots have loaded', () => {
      expect(page['verdict']()).toBeNull();

      page['snapA'].set(snapshot('a', ZERO));
      expect(page['verdict']()).toBeNull();
    });

    it('picks the side that wins more of the five metrics', () => {
      expect(compare({ followers: 10, totalStars: 10, totalForks: 10 }, { public_repos: 1 })).toBe(
        'a',
      );
      expect(compare({ followers: 1 }, { public_repos: 5, totalStars: 5, following: 5 })).toBe('b');
    });

    it('calls a tie on equal metrics and on an even split', () => {
      expect(compare({}, {})).toBe('tie');
      // a wins followers + stars, b wins repos + forks, following is level.
      expect(compare({ followers: 9, totalStars: 9 }, { public_repos: 9, totalForks: 9 })).toBe(
        'tie',
      );
    });
  });

  describe('barWidth()', () => {
    it('scales against the larger side and keeps a visible stub', () => {
      expect(page.barWidth(10, 10)).toBe('100%');
      expect(page.barWidth(50, 100)).toBe('50%');
      // A losing side must stay visible instead of collapsing to nothing.
      expect(page.barWidth(0, 100)).toBe('3%');
    });

    it('does not divide by zero when both sides are zero', () => {
      expect(page.barWidth(0, 0)).toBe('3%');
    });
  });
});
