import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal(false);
  loginError = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  async submit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    this.loginError.set(null);

    const { email, password } = this.form.getRawValue();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Debug: log response status and headers
      console.debug('login: response status', res.status, res.statusText);
      const json = await res.json().catch(async () => {
        const text = await res.text().catch(() => null);
        console.debug('login: non-json response', text);
        return null;
      });
      console.debug('login: parsed body', json);

      if (!res.ok) {
        // try to extract a helpful message
        const msg = (json && (json.message || JSON.stringify(json))) || (await res.text().catch(() => 'Login failed'));
        this.loginError.set(msg);
        return;
      }

      if (json?.requires2FA) {
        this.loginError.set('Two-factor authentication required. Please complete 2FA flow.');
        return;
      }

      if (json?.token) {
        localStorage.setItem('token', json.token);
      }

      // Build a consistent user object from returned fields
      const userRaw = json?.user ?? { id: json?.userId, email: json?.email, displayName: json?.displayName };
      if (userRaw) {
        const normalizedUser = {
          username: userRaw.username ?? userRaw.displayName ?? userRaw.email,
          email: userRaw.email,
          id: userRaw.id,
          displayName: userRaw.displayName
        };
        try { localStorage.setItem('user', JSON.stringify(normalizedUser)); } catch {}
      }

      this.router.navigateByUrl('/dashboard');
    } catch (err: any) {
      this.loginError.set(err?.message ?? String(err));
    } finally {
      this.isLoading.set(false);
    }
  }
}

