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
  showPassword = signal(false);
  registerSuccess = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit() {
    if (this.form.invalid || !this.passwordsMatch) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.registerError.set(null);
    this.registerSuccess.set(null);

    const { email, password } = this.form.getRawValue();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const text = await res.text().catch(() => null);
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) {
        const msg =
          (json && (json.message || json.error)) ||
          'Registration failed';
        this.registerError.set(msg);
        return;
      }

      // Don’t auto-login. Just show a success and send them to login.
      this.registerSuccess.set('Account created! Please log in to continue.');
      await this.router.navigateByUrl('/login');

    } catch (err: any) {
      this.registerError.set(err?.message || String(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePassword() {
    this.showPassword.update(show => !show);
  }

  get passwordsMatch(): boolean | null {
    const password = this.form.get('password')?.value;
    const confirm = this.form.get('confirm')?.value;

    if (!password || !confirm) return null;
    return password === confirm;
  }

  get showPasswordMatchStatus(): boolean {
    const confirmControl = this.form.get('confirm');
    return !!(confirmControl?.value && confirmControl?.touched);
  }
}
