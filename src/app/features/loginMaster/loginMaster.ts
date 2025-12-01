import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Login } from './login/login';
import { TwoFaComponent } from './two-fa-component/two-fa-component';

type LoginFlowMode = 'login' | 'twofa-verify' | 'twofa-setup';

@Component({
  standalone: true,
  selector: 'app-login-master',
  imports: [CommonModule, RouterModule, Login, TwoFaComponent],
  templateUrl: './loginMaster.html',
  styleUrls: ['./loginMaster.scss']
})
export class LoginMaster {
  private router = inject(Router);

  mode = signal<LoginFlowMode>('login');
  twoFaChallengeId = signal<string | null>(null);

  /** Called when login succeeds (no *immediate* 2FA challenge). */
  handleLoginSuccess(ev: { twoFaSetupRecommended: boolean }) {
    if (ev?.twoFaSetupRecommended) {
      this.mode.set('twofa-setup');
    } else {
      this.router.navigateByUrl('/dashboard');
    }
  }

  /** Called when backend says: you must verify 2FA now. */
  handleTwoFaRequired(ev: { challengeId: string; remember: boolean }) {
    this.twoFaChallengeId.set(ev.challengeId);
    this.mode.set('twofa-verify');
  }

  /** 2FA verification succeeded. */
  handleTwoFaVerified() {
    this.router.navigateByUrl('/dashboard');
  }

  /** User backed out of verification. */
  handleTwoFaVerifyCancelled() {
    this.mode.set('login');
  }

  /** 2FA setup finished successfully. */
  handleTwoFaSetupCompleted() {
    this.router.navigateByUrl('/dashboard');
  }

  /** User chose "remind me later" or cancelled setup. */
  handleTwoFaSetupCancelled() {
    this.router.navigateByUrl('/dashboard');
  }
}
