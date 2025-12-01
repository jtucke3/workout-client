import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Output,
  signal
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface RegisterWebRequestWebVo {
  email: string;
  password: string;
  displayName: string;
}

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  @Output() registrationCompleted = new EventEmitter<void>();

  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const { displayName, email, password } = this.form.getRawValue();

    const payload: RegisterWebRequestWebVo = {
      displayName: displayName!,
      email: email!,
      password: password!
    };

    try {
      await this.http
        .post('/api/auth/register', payload)
        .toPromise();

      // IMPORTANT: we do NOT store any token here.
      // Just show success and bounce them back to login.
      this.success.set('Account created successfully. Please sign in to continue.');
      this.registrationCompleted.emit();
    } catch (err: any) {
      console.error('Register error:', err);
      this.error.set('Could not create account. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
