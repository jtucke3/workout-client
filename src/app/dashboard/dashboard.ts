import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private router = inject(Router);

  logout() {
    // Optional: clear auth token or localStorage here
    this.router.navigateByUrl('/');
  }
}
