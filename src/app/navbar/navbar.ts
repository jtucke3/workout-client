import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {

  // logout() {
  //   localStorage.removeItem('token');
  //   fetch('/api/auth/logout', { method: 'POST' });
  //   window.location.href = '/login';
  // }
}
