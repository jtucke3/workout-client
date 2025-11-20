import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../loginService/login.service';
import { LoginRequestWebVo } from '../loginModels/login-api.models';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);
  
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() twoFaRequired = new EventEmitter<{ challengeId: string; remember: boolean }>();


  isLoading = signal(false);
  loginError = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false]
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
      const payload: LoginRequestWebVo = {
        email: email!,
        password: password!,
      };

      const response = await this.loginService.login(payload);

      if (response.requires2FA && response.challengeId) {
        this.twoFaRequired.emit({
          challengeId: response.challengeId,
          remember: !!remember,
        });
        return;
      }


      if (response.token) {
        this.loginService.storeToken(response.token, !!remember);
        this.loginSuccess.emit();
        return;
      }

      throw new Error('No token or 2FA challenge returned from server');
    } catch (err: any) {
      console.error('Login error:', err);
      this.loginError.set('Login failed: ' + (err.message || 'Unknown error'));
    } finally {
      this.isLoading.set(false);
    }
  }
}

