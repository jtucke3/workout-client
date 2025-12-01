import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  // During SSR there is no window/localStorage; allow render and defer auth to client.
  if (typeof window === 'undefined') {
    return true;
  }

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    router.navigateByUrl('/login');
    return false;
  }

  return true;
};