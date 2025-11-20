import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss']
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal(false);
  message = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async submit() {
    if (this.form.invalid) return;
    this.isLoading.set(true);
    await new Promise(r => setTimeout(r, 600));
    this.message.set('If an account exists for that email we sent reset instructions.');
    this.isLoading.set(false);
  }
}
