import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UnitService } from '../../shared/services/unit.service';
import { Navbar } from '../../shared/components/navbar/navbar';
import { AuthUserService } from '../../shared/services/auth-user.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private unitService = inject(UnitService);
  private authUser = inject(AuthUserService);

  // Used in dashboard.html: user()?.displayName
  user = this.authUser.user;

  // For now, weight here is still placeholder/demo data.
  // Later we’ll replace this with real backend-driven values.
  weightInPounds = 180;

  get displayedWeight(): number {
    const preferredUnit = this.unitService.getPreferredUnit();
    return this.unitService.convertWeight(this.weightInPounds, 'POUNDS', preferredUnit);
  }

  get weightSymbol(): string {
    return this.unitService.getSymbol();
  }

  friends = [
    { name: 'Alex', workout: 'Leg Day', date: new Date() },
    { name: 'Jordan', workout: 'Push Day', date: new Date() },
    { name: 'Taylor', workout: 'Cardio Session', date: new Date() },
  ];

  get lastMealName(): string {
    // Placeholder until meals are wired to backend
    return 'Chicken Salad';
  }

  caloriesConsumed = 1200;
  calorieGoal = 2000;

  get caloriesPercent(): number {
    return (this.caloriesConsumed / this.calorieGoal) * 100;
  }

  goalTitle = 'Lose 5 lbs';
  goalPercent = 40;
}
