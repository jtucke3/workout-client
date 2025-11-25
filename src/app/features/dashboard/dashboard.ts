import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnitService } from '../../shared/services/unit.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private router = inject(Router);
  private unitService = inject(UnitService);
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

  // Example stored weight for testing
  weightInPounds = 100;

  // Displayed weight after conversion
  get displayedWeight(): number {
    const preferred = this.unitService.getPreferredUnit();
    return this.unitService.convertWeight(this.weightInPounds, 'POUNDS', preferred);
  }

  // Get unit symbol (lbs / kg)
  get weightSymbol(): string {
    return this.unitService.getSymbol();
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
