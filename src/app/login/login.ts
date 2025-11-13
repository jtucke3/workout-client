import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
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

    const { email, password, remember } = this.form.getRawValue();

    try {
      // Test credentials
      if (email === 'test@example.com' && password === 'password123') {
        if (remember) {
          localStorage.setItem('token', 'test-token');
        }
        else {
          sessionStorage.setItem('token', 'test-token');
        }
        //localStorage.setItem('token', 'test-token');
        this.router.navigateByUrl('/dashboard');
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials or server error');
      }

      const data = await response.json();

      if (data.requires2FA) {
        this.loginError.set('2FA verification required.');
      } else if (data.token) {
        if (remember) {
          localStorage.setItem('token', data.token);
        }
        else {
          sessionStorage.setItem('token', data.token);
        }
        this.router.navigateByUrl('/dashboard');
      } else {
        throw new Error('No token returned from backend');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      this.loginError.set('Login failed: ' + err.message);
    } finally {
      this.isLoading.set(false);
    }
  }
}

