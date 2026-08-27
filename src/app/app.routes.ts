import { Routes } from '@angular/router';
import { validUsernameGuard } from './core/guards/valid-username.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/search/search-page').then((m) => m.SearchPage),
    title: 'Git Scope — Explore GitHub profiles',
  },
  {
    path: 'compare',
    loadComponent: () => import('./features/compare/compare-page').then((m) => m.ComparePage),
    title: 'Compare developers — Git Scope',
  },
  {
    path: 'u/:login',
    canActivate: [validUsernameGuard],
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
    title: 'Profile — Git Scope',
  },
  { path: '**', redirectTo: '' },
];
