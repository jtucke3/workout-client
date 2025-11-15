// loginModels/login-view.models.ts

// Shape of the login form inside the component
export interface LoginFormViewModel {
  email: string;
  password: string;
  remember: boolean;
}

// When you add a separate 2FA step later:
export interface TwoFaFormViewModel {
  code: string;
}
