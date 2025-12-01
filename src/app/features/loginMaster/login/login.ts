import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginService } from '../loginService/login.service';
import { LoginRequestWebVo } from '../loginModels/login-api.models';
import { AuthUserService } from '../../../shared/services/auth-user.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);
  private authUser = inject(AuthUserService);

  /**
   * Fired when login completes WITHOUT needing immediate 2FA verification.
   * twoFaSetupRecommended = true means we should send the user into 2FA setup.
   */
  @Output() loginSuccess = new EventEmitter<{ twoFaSetupRecommended: boolean }>();

  /**
   * Fired when backend indicates a 2FA challenge is required immediately.
   */
  @Output() twoFaRequired = new EventEmitter<{ challengeId: string; remember: boolean }>();

  isLoading = signal(false);
  loginError = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false]
  });

  async submit() {
    if (this.form.invalid) {
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

      // Normalize and store in-memory user
      this.authUser.setUserFromAuthPayload(response);

      // If backend says we need to verify 2FA now, go into verify mode.
      if (response.requires2FA && response.challengeId) {
        this.twoFaRequired.emit({
          challengeId: response.challengeId,
          remember: !!remember,
        });
        return;
      }

      if (response.token) {
        this.loginService.storeToken(response.token, !!remember);

        // If backend tells us this account does NOT have 2FA configured,
        // ask loginMaster to send the user into 2FA setup.
        const twoFaSetupRecommended =
          (response as any).hasTwoFactorConfigured === false;

        this.loginSuccess.emit({ twoFaSetupRecommended });
        return;
      }

      throw new Error('No token or 2FA challenge returned from server');
    } catch (err: any) {
      console.error('Login error:', err);
      this.loginError.set('Login failed: ' + (err?.message || 'Unknown error'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
