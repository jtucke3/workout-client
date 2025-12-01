import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type ChangePasswordResponse = {
  success?: boolean;
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  private readonly ACCOUNT_API_BASE = '/api/account';

  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    const token =
      (typeof window !== 'undefined' && (localStorage.getItem('token') || sessionStorage.getItem('token')))
        || null;

    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    const body = {
      currentPassword,
      newPassword
    };

    return firstValueFrom(
      this.http.put<ChangePasswordResponse>(
        `${this.ACCOUNT_API_BASE}/change-password`,
        body,
        { headers }
      )
    );
  }
}
