import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  LoginRequestWebVo,
  LoginResponseWebVo,
  Verify2faRequestWebVo
} from '../loginModels/login-api.models';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private readonly BASE = '/api/auth';

  login(payload: LoginRequestWebVo): Promise<LoginResponseWebVo> {
    return firstValueFrom(
      this.http.post<LoginResponseWebVo>(`${this.BASE}/login`, payload)
    );
  }

  verifyTwoFactor(payload: Verify2faRequestWebVo): Promise<LoginResponseWebVo> {
    return firstValueFrom(
      this.http.post<LoginResponseWebVo>(`${this.BASE}/2fa/verify`, payload)
    );
  }

  /**
   * Begin 2FA setup for the given email.
   * Backend responds with { otpauthUri: string }.
   */
  beginTwoFactorSetup(email: string): Promise<{ otpauthUri: string }> {
    return firstValueFrom(
      this.http.post<{ otpauthUri: string }>(
        `${this.BASE}/2fa/enable`,
        {}, // empty body; we send email as a query param
        { params: { email } }
      )
    );
  }

  storeToken(token: string, remember: boolean) {
    if (typeof window === 'undefined') {
      return;
    }

    if (remember) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  clearToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }
}
