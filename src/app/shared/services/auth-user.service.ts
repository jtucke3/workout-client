import { Injectable, signal } from '@angular/core';

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

  // Read-only signal for consumers
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
      console.log('[AuthUserService] Cleared current user (no payload)');
      return;
    }

    const userPart = (payload as any).user ?? payload;

    const normalized: CurrentUser = {
      // be VERY forgiving about id field names
      id:
        userPart.id ??
        userPart.userId ??
        (payload as any).id ??
        (payload as any).userId,

      email: userPart.email ?? (payload as any).email,
      displayName: userPart.displayName ?? (payload as any).displayName,
      username:
        userPart.username ??
        userPart.displayName ??
        (payload as any).displayName ??
        userPart.email ??
        (payload as any).email,

      weight: userPart.weight,
      preferredUnit: userPart.preferredUnit ?? (payload as any).preferredUnit
    };

    this._user.set(normalized);
    console.log('[AuthUserService] Set current user:', normalized);
  }

  /**
   * Alias for older code paths that think in terms of "backend user" directly.
   * Internally just forwards to setUserFromAuthPayload.
   */
  setFromBackendUser(raw: any | null | undefined): void {
    this.setUserFromAuthPayload(raw);
  }

  /**
   * Set user explicitly (e.g., after editing profile name).
   */
  setUser(user: CurrentUser | null): void {
    this._user.set(user);
    console.log('[AuthUserService] Set current user explicitly:', user);
  }

  clear(): void {
    this._user.set(null);
    console.log('[AuthUserService] Cleared current user (logout)');
  }
}
