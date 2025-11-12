import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal(false);
  registerError = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]]
  });

  async submit() {
    if (this.form.invalid) return;
    const { name, email, password, confirm } = this.form.getRawValue();
    if (password !== confirm) {
      this.registerError.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.registerError.set(null);

    try {
      // Call server register endpoint
      const registerBody = { email: email, password: password, displayName: name };
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerBody)
      });
      console.debug('register: response status', regRes.status, regRes.statusText);
      const regText = await regRes.text().catch(() => null);
      try { console.debug('register: body text', regText); } catch {}
      if (!regRes.ok) {
        let msg = regText || 'Registration failed';
        try { const j = JSON.parse(regText || ''); msg = j.message || JSON.stringify(j); } catch {}
        this.registerError.set(msg || 'Registration failed');
        return;
      }

      // On success, attempt to log in automatically
      const loginBody = { email: email, password: password };
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginBody)
      });
      console.debug('register->login: response status', loginRes.status, loginRes.statusText);
      const loginText = await loginRes.text().catch(() => null);
      let loginJson = null;
      try { loginJson = loginText ? JSON.parse(loginText) : null; } catch (e) { console.debug('register->login: json parse error', e); }
      console.debug('register->login: parsed body', loginJson);
      if (!loginRes.ok) {
        this.registerError.set((loginJson && (loginJson.message || JSON.stringify(loginJson))) || 'Login failed after registration');
        return;
      }

      if (loginJson?.requires2FA) {
        // If 2FA is required, surface a message (full 2FA flow not implemented here)
        this.registerError.set('Two-factor authentication required. Please complete 2FA flow.');
        return;
      }

      if (loginJson?.token) {
        localStorage.setItem('token', loginJson.token);
      }

      // Cache user object if provided by server so other pages (dashboard/profile) can show it immediately
      const userFromResponse = loginJson?.user ?? (loginJson ? { id: loginJson.userId, email: loginJson.email, displayName: loginJson.displayName } : null);
      if (userFromResponse) {
        const normalizedUser = {
          username: userFromResponse.username ?? userFromResponse.displayName ?? userFromResponse.email,
          email: userFromResponse.email,
          id: userFromResponse.id,
          displayName: userFromResponse.displayName
        };
        try { localStorage.setItem('user', JSON.stringify(normalizedUser)); } catch {}
      }

      this.router.navigateByUrl('/dashboard');

    } catch (err: any) {
      this.registerError.set(err?.message || String(err));
    } finally {
      this.isLoading.set(false);
    }
  }
}
