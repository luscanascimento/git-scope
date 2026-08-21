import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';

import { validUsernameGuard } from './valid-username.guard';

describe('validUsernameGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  /** Runs the guard for a `:login` route param. */
  function guard(login: string): boolean | UrlTree {
    const route = {
      paramMap: convertToParamMap({ login }),
    } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(
      () => validUsernameGuard(route, {} as RouterStateSnapshot) as boolean | UrlTree,
    );
  }

  it('accepts a plain alphanumeric username', () => {
    expect(guard('octocat')).toBeTrue();
    expect(guard('user123')).toBeTrue();
    expect(guard('7')).toBeTrue();
  });

  it('accepts single hyphens between alphanumerics', () => {
    expect(guard('lucas-nascimento')).toBeTrue();
    expect(guard('a-b-c-1')).toBeTrue();
  });

  it('rejects a trailing hyphen', () => {
    expect(guard('octocat-')).toBeInstanceOf(UrlTree);
  });

  it('rejects a leading hyphen', () => {
    expect(guard('-octocat')).toBeInstanceOf(UrlTree);
  });

  it('rejects consecutive hyphens', () => {
    expect(guard('oct--cat')).toBeInstanceOf(UrlTree);
  });

  it('accepts exactly 39 characters', () => {
    const login = 'a'.repeat(39);
    expect(login.length).toBe(39);
    expect(guard(login)).toBeTrue();
  });

  it('rejects 40 characters', () => {
    expect(guard('a'.repeat(40))).toBeInstanceOf(UrlTree);
  });

  it('rejects an empty username', () => {
    expect(guard('')).toBeInstanceOf(UrlTree);
  });

  it('rejects characters GitHub does not allow', () => {
    expect(guard('oct cat')).toBeInstanceOf(UrlTree);
    expect(guard('oct_cat')).toBeInstanceOf(UrlTree);
    expect(guard('oct.cat')).toBeInstanceOf(UrlTree);
  });

  it('redirects home and forwards the rejected value as a query param', () => {
    const tree = guard('bad--name') as UrlTree;

    expect(tree.toString()).toBe('/?invalid=bad--name');
  });
});
