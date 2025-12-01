import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  LoginRequestWebVo,
  LoginResponseWebVo,
  Verify2faRequestWebVo,
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

  beginTwoFactorSetup(email: string): Promise<{ otpauthUri: string }> {
    return firstValueFrom(
      this.http.post<{ otpauthUri: string }>(
        `${this.BASE}/2fa/enable`,
        null,
        { params: { email } }
      )
    );
  }

  confirmTwoFactorSetup(email: string, code: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.BASE}/2fa/confirm-setup`, { email, code })
    );
  }

  storeToken(token: string, rememberMe: boolean) {
    if (typeof window === 'undefined') return;
    if (rememberMe) {
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
