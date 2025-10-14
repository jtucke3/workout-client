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

    const { email, password } = this.form.getRawValue();
    await new Promise(r => setTimeout(r, 500));
    if (email === 'test@example.com' && password === 'password123') {
      this.router.navigateByUrl('/dashboard');
    } else {
      this.loginError.set('Invalid email or password.');
    }
    this.isLoading.set(false);
  }
}
