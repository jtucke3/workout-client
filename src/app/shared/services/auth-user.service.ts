import { inject, Injectable, signal } from '@angular/core';

export interface CurrentUser {
  id?: string;
  email?: string;
  displayName?: string;
  username?: string;
  weight?: number;
  preferredUnit?: string;
}

/**
 * Holds the current logged-in user in memory (signals).
 * No localStorage/sessionStorage caching here — the backend
 * and login/2FA flows are the source of truth.
 */
@Injectable({ providedIn: 'root' })
export class AuthUserService {
  private readonly _user = signal<CurrentUser | null>(null);

  readonly user = this._user;

  /**
   * Generic normalizer for whatever the auth endpoints return.
   * It supports either:
   *  - { user: { ...fields... }, token, ... }
   *  - { email, displayName, id, weight, preferredUnit, ... }
   */
  setUserFromAuthPayload(payload: any | null | undefined): void {
    if (!payload) {
      this._user.set(null);
      return;
    }

    const userPart = (payload as any).user ?? payload;

    const normalized: CurrentUser = {
      id: userPart.id ?? (payload as any).id,
      email: userPart.email ?? (payload as any).email,
      displayName: userPart.displayName ?? (payload as any).displayName,
      username:
        userPart.username ??
        userPart.displayName ??
        (payload as any).displayName ??
        userPart.email ??
        (payload as any).email,
      weight: userPart.weight,
      preferredUnit: userPart.preferredUnit,
    };

    this._user.set(normalized);
  }

  /**
   * Set user explicitly (e.g., after editing profile name).
   */
  setUser(user: CurrentUser | null): void {
    this._user.set(user);
  }

  clear(): void {
    this._user.set(null);
  }
}
