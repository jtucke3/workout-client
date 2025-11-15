// loginService/login.service.ts
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

  // if you later add environments, change this to environment.apiBaseUrl + '/auth'
  private readonly API_BASE = '/api/auth';

  login(req: LoginRequestWebVo): Promise<LoginResponseWebVo> {
    return firstValueFrom(
      this.http.post<LoginResponseWebVo>(`${this.API_BASE}/login`, req)
    );
  }

  verify2fa(req: Verify2faRequestWebVo): Promise<LoginResponseWebVo> {
    return firstValueFrom(
      this.http.post<LoginResponseWebVo>(`${this.API_BASE}/2fa/verify`, req)
    );
  }

  enable2fa(email: string): Promise<string> {
    // just returns the otpauth URI as plain text (for now)
    return firstValueFrom(
      this.http.post(`${this.API_BASE}/2fa/enable?email=${encodeURIComponent(email)}`, {}, { responseType: 'text' })
    );
  }

  storeToken(token: string, remember: boolean) {
    if (remember) {
      localStorage.setItem('token', token);
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');
    }
  }

  clearToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
}
