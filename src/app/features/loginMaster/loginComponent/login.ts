import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../loginService/login.service';

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
  private loginService = inject(LoginService);

  isLoading = signal(false);
  loginError = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  async submit() {
    if (this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }
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

      const response = await this.loginService.login({
        email: email!,
        password: password!
      });

      if (response.requires2FA) {
        // TODO: handle 2FA step later (e.g., show 2FA component)
        this.loginError.set('2FA verification required (frontend flow TBD).');
        return;
      }


      if (response.token) {
        this.loginService.storeToken(response.token, !!remember);
        this.router.navigateByUrl('/dashboard');
      } else {
        throw new Error('No token returned from backend');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      this.loginError.set('Login failed: ' + (err.message || 'Unknown error'));
    } finally {
      this.isLoading.set(false);
    }
  }
}

