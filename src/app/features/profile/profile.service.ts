import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthUserService } from '../../shared/services/auth-user.service';
import { BaseWebResponse, ChangePasswordRequest } from '../../shared/models/base-web-response.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private authUser = inject(AuthUserService);

  private readonly ACCOUNT_API_BASE = '/api/account';

  private buildHeaders(): HttpHeaders {
    const token =
      (typeof window !== 'undefined' && (localStorage.getItem('token') || sessionStorage.getItem('token')))
      || null;

    const currentUser = this.authUser.user();
    const userId = currentUser?.id || (typeof window !== 'undefined' && (localStorage.getItem('userId') || sessionStorage.getItem('userId'))) || null;

    const headersInit: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (token) headersInit['Authorization'] = `Bearer ${token}`;
    if (userId) headersInit['X-User-Id'] = userId;

    return new HttpHeaders(headersInit);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<BaseWebResponse> {
    const headers = this.buildHeaders();
    const body: ChangePasswordRequest = { currentPassword, newPassword };

    return firstValueFrom(
      this.http.put<BaseWebResponse>(
        `${this.ACCOUNT_API_BASE}/change-password`,
        body,
        { headers }
      )
    );
  }
}
