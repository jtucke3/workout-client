import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type UserProfile = {
  username?: string;
  email?: string;
  preferredUnit?: string;
  weight?: number;
};

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  private router = inject(Router);

  isLoading = signal(true);
  error = signal<string | null>(null);
  profile = signal<UserProfile | null>(null);

  ngOnInit() {
    // Only run profile loading in the browser. localStorage / window are not available during SSR.
    if (typeof window !== 'undefined') {
      this.loadProfile();
    } else {
      this.isLoading.set(false);
    }
  }

  async loadProfile() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
  const token = localStorage.getItem('token');
  const headers: Record<string,string> = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch('/api/auth/me', { headers });

      if (res.status === 401) {
        this.router.navigateByUrl('/login');
        return;
      }

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json();
        // Normalize user fields: prefer username, fallback to displayName
        const normalized = {
          username: data.username ?? data.displayName ?? data.email,
          email: data.email,
          preferredUnit: data.preferredUnit,
          weight: data.weight
        };
        this.profile.set(normalized || null);
        try { localStorage.setItem('user', JSON.stringify(normalized)); } catch {}
      } else {
        const cached = localStorage.getItem('user');
        if (cached) {
          try { this.profile.set(JSON.parse(cached)); } catch {}
        } else {
          this.profile.set({});
          console.warn('Profile: server returned a non-JSON response and no cached data was found.');
        }
      }
    } catch (e: any) {
      const cached = localStorage.getItem('user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // normalize cached shape too
          const normalized = {
            username: parsed.username ?? parsed.displayName ?? parsed.email,
            email: parsed.email,
            preferredUnit: parsed.preferredUnit,
            weight: parsed.weight
          };
          this.profile.set(normalized);
        } catch {}
      } else {
        this.profile.set({});
        console.warn('Profile load failed and no cached data available:', e);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  onChangeEmail() {
    console.log('Change email clicked');
  }

  onChangeUsername() {
    console.log('Change username clicked');
  }

  goBack() {
    this.router.navigateByUrl('/dashboard');
  }
}
