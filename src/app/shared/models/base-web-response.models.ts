export interface BaseWebResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}