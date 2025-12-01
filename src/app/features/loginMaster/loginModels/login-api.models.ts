// loginModels/login-api.models.ts

// This matches the JSON your backend expects on /api/auth/login
export interface LoginRequestWebVo {
  email: string;
  password: string;
}

// This matches the JSON your backend returns from /api/auth/login and /2fa/verify
export interface LoginResponseWebVo {
  token?: string;
  requires2FA?: boolean;
  challengeId?: string;
  email?: string;
  displayName?: string;

  // NEW: backend tells us if 2FA is already configured
  hasTwoFactorConfigured?: boolean;
}

// Request payload for 2FA verify endpoint
export interface Verify2faRequestWebVo {
  challengeId: string;
  code: string;
}
export interface Confirm2faSetupRequestWebVo {
  email: string;
  code: string;
}

