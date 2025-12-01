import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Login } from './login/login';
import { TwoFaComponent } from './two-fa-component/two-fa-component';
@Component({
  standalone: true,
  selector: 'app-login-master',
  imports: [CommonModule, Login, TwoFaComponent],
  templateUrl: './loginMaster.html',
  styleUrls: ['./loginMaster.scss']
})
export class LoginMaster {
  private router = inject(Router);

  step = signal<'login' | '2fa'>('login');
  challengeId = signal<string | null>(null);
  remember = signal<boolean>(false);

  onLoginSuccess() {
    this.router.navigateByUrl('/dashboard');
  }

  onTwoFaRequired(evt: { challengeId: string; remember: boolean }) {
    this.challengeId.set(evt.challengeId);
    this.remember.set(evt.remember);
    this.step.set('2fa');
  }

  onTwoFaVerified() {
    this.router.navigateByUrl('/dashboard');
  }

  backToLogin() {
    this.step.set('login');
    this.challengeId.set(null);
  }
}