import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnitService } from '../../shared/services/unit.service';
import { Navbar } from '../../shared/components/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private unitService = inject(UnitService);
  isLoading = signal(true);
  user = signal<{ displayName?: string; email?: string } | null>(null);

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
}
