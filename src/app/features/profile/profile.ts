import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/components/navbar/navbar';
import { ProfileService } from './profile.service';
import { AuthUserService } from '../../shared/services/auth-user.service';

type UserProfile = {
  username?: string;
  email?: string;
  preferredUnit?: string;
  weight?: number;
};

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, Navbar],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  private profileService = inject(ProfileService);
  private authUser = inject(AuthUserService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  profile = signal<UserProfile | null>(null);
  passwordChangeSuccess = signal<string | null>(null);
  passwordChangeError = signal<string | null>(null);

  showNameModal = false;
  showPasswordModal = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  async loadProfile() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const current = this.authUser.user();

      if (!current) {
        this.profile.set(null);
      } else {
        const normalized: UserProfile = {
          username: current.username ?? current.displayName ?? current.email,
          email: current.email,
          preferredUnit: current.preferredUnit,
          weight: current.weight
        };
        this.profile.set(normalized);
      }
    } catch (e) {
      console.error('Error loading profile', e);
      this.error.set('Failed to load profile information.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- Name modal ---

  openNameModal() {
    this.showNameModal = true;
  }

  closeNameModal() {
    this.showNameModal = false;
  }

  submitNameChange(name: string) {
    const trimmed = name?.trim();
    if (!trimmed) {
      this.closeNameModal();
      return;
    }

    const current = this.profile() || {};
    const updated: UserProfile = {
      ...current,
      username: trimmed
    };

    // Update local profile view
    this.profile.set(updated);

    // Also update shared auth user state in memory
    const authUser = this.authUser.user();
    this.authUser.setUser({
      ...(authUser || {}),
      username: trimmed,
      displayName: trimmed
    });

    this.closeNameModal();
  }

  // --- Password modal ---

  openPasswordModal() {
    this.showPasswordModal = true;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
  }

  async submitPasswordChange(currentPassword: string, newPassword: string) {
    const currentTrimmed = currentPassword?.trim();
    const newTrimmed = newPassword?.trim();

    if (!currentTrimmed || !newTrimmed) {
      this.closePasswordModal();
      return;
    }

    try {
      if (currentTrimmed === newTrimmed) {
        this.passwordChangeError.set('New password must be different from current password.');
        return;
      }

      const response = await this.profileService.changePassword(currentTrimmed, newTrimmed);
      if (response?.success) {
        this.passwordChangeSuccess.set(response.message || 'Password changed successfully.');
        this.passwordChangeError.set(null);
      } else {
        this.passwordChangeError.set(response?.message || 'Failed to change password.');
        this.passwordChangeSuccess.set(null);
      }
    } catch (e) {
      console.error('Change password failed', e);
      this.passwordChangeError.set('An unexpected error occurred changing password.');
      this.passwordChangeSuccess.set(null);
    } finally {
      this.closePasswordModal();
    }
  }
}
