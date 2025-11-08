import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'meals', loadComponent: () => import('./meals/meals').then(m => m.Meals) },
  { path: 'about', loadComponent: () => import('./about/about').then(m => m.About) },
  { path: 'friends', loadComponent: () => import('./friends/friends').then(m => m.Friends) },
  { path: 'goals', loadComponent: () => import('./goals/goals').then(m => m.Goals) },
  { path: 'profile', loadComponent: () => import('./profile/profile').then(m => m.Profile) },
  { path: 'workouts', loadComponent: () => import('./workouts/workouts').then(m => m.Workouts) },
  { path: '**', redirectTo: 'login' }
];
