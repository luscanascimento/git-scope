import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { USERNAME_RE } from '../github';

/**
 * Functional route guard: rejects obviously invalid usernames before an
 * API call is ever made, redirecting home instead of showing a spurious
 * "not found" state.
 */
export const validUsernameGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const login = route.paramMap.get('login') ?? '';
  if (USERNAME_RE.test(login)) {
    return true;
  }
  return router.createUrlTree(['/'], {
    queryParams: { invalid: login },
  });
};
