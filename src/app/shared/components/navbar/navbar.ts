import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthUserService } from '../../services/auth-user.service';
import { LoginService } from '../../../features/loginMaster/loginService/login.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private router = inject(Router);
  private authUser = inject(AuthUserService);
  private loginService = inject(LoginService);

  // Used by navbar.html: user()?.displayName, user()?.email
  user = this.authUser.user;

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  logout() {
    // Best effort logout to backend if we have a token
    const token = this.loginService.getToken();

    if (typeof window !== 'undefined') {
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {
          // Ignore network/logging errors on logout
        });
      }

      // Clear auth state on the client
      this.loginService.clearToken();
      this.authUser.clear();

      this.router.navigateByUrl('/login');
    }
  }
}
