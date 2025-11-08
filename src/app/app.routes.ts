import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'profile', loadComponent: () => import('./profile/profile').then(m => m.Profile) },
  { path: '**', redirectTo: 'login' }
];
