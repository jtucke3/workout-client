import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private router = inject(Router);
  isLoading = signal(true);
  user = signal<{ displayName?: string; email?: string } | null>(null);

  constructor() {
    // Only load user in the browser. During SSR there is no localStorage/window.
    if (typeof window !== 'undefined') {
      this.loadUser();
    } else {
      this.isLoading.set(false);
    }
  }

  logout() {
    localStorage.removeItem('token');
    fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  private async loadUser() {
    this.isLoading.set(true);
    // Try cached user first
    const cached = localStorage.getItem('user');
    if (cached) {
      try { this.user.set(JSON.parse(cached)); } catch { this.user.set(null); }
    }

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string,string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        this.user.set({ displayName: data.displayName || data.name || data.display_name, email: data.email });
        try { localStorage.setItem('user', JSON.stringify(data)); } catch {}
      }
    } catch (e) {
      // network error — keep cached if present
    } finally {
      this.isLoading.set(false);
    }
  }
}
