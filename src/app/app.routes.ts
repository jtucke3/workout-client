import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'meals', canActivate: [authGuard], loadComponent: () => import('./meals/meals').then(m => m.Meals) },
  { path: 'about', canActivate: [authGuard], loadComponent: () => import('./about/about').then(m => m.About) },
  { path: 'friends', canActivate: [authGuard], loadComponent: () => import('./friends/friends').then(m => m.Friends) },
  { path: 'goals', canActivate: [authGuard], loadComponent: () => import('./goals/goals').then(m => m.Goals) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./profile/profile').then(m => m.Profile) },
  { path: 'workouts', canActivate: [authGuard], loadComponent: () => import('./workouts/workouts').then(m => m.Workouts) },
  { path: '**', redirectTo: 'login' }
];
