import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnitService } from '../services/unit.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private router = inject(Router);
  private unitService = inject(UnitService);

  // Example stored weight for testing
  weightInPounds = 100;

  // Displayed weight after conversion
  get displayedWeight(): number {
    const preferred = this.unitService.getPreferredUnit();
    return this.unitService.convertWeight(this.weightInPounds, 'POUNDS', preferred);
  }

  // Get unit symbol (lbs / kg)
  get weightSymbol(): string {
    return this.unitService.getSymbol();
  }

  logout() {
    localStorage.removeItem('token');
    fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }
}
