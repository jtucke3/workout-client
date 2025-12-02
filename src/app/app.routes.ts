import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./features/loginMaster/loginMaster').then(m => m.LoginMaster) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'meals', canActivate: [authGuard], loadComponent: () => import('./features/meals/meals').then(m => m.Meals) },
  { path: 'about', canActivate: [authGuard], loadComponent: () => import('./about/about').then(m => m.About) },
  { path: 'friends', canActivate: [authGuard], loadComponent: () => import('./features/friends/friends').then(m => m.Friends) },
  { path: 'goals', canActivate: [authGuard], loadComponent: () => import('./features/goals/goals').then(m => m.Goals) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile').then(m => m.Profile) },
  { path: 'register', loadComponent: () => import('./features/register/register').then(m => m.Register) },
  { path: 'forgot-password', loadComponent: () => import('./features/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'workouts', canActivate: [authGuard], loadComponent: () => import('./features/workouts/workouts').then(m => m.Workouts) },
{ path: 'friend-profile/:friendId',canActivate: [authGuard],loadComponent: () =>import('./features/friends/friend-profile/friend-profile').then(m => m.FriendProfile)},  { path: '**', redirectTo: 'login' } 
];
