import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnitService } from '../../shared/services/unit.service';
import { Navbar } from '../../shared/components/navbar/navbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private unitService = inject(UnitService);
  isLoading = signal(true);
  user = signal<{ displayName?: string; email?: string } | null>(null);

  constructor() {
    // Only load user in the browser. During SSR there is no localStorage/window.
    if (typeof window !== 'undefined') {
      this.loadUser();
    } else {
      this.isLoading.set(false);
    }
  }

  private async loadUser() {
    this.isLoading.set(true);
    // Try cached user first
    const cached = localStorage.getItem('user');
    if (cached) {
      try { this.user.set(JSON.parse(cached)); } catch { this.user.set(null); }
    }

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string,string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        this.user.set({ displayName: data.displayName || data.name || data.display_name, email: data.email });
        try { localStorage.setItem('user', JSON.stringify(data)); } catch {}
      }
    } catch (e) {
      // network error — keep cached if present
    } finally {
      this.isLoading.set(false);
    }
  }

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

  friends = [
    { name: "John Doe", workout: "Chest Day – 45 min", date: new Date() },
    { name: "Sarah Lee", workout: "5 Mile Run", date: new Date(Date.now() - 3600_000) },
    { name: "Miguel Torres", workout: "Leg Day – 60 min", date: new Date(Date.now() - 7200_000) },
  ];

  //lastMealName = null; // placeholder
  get lastMealName(): string {
    return "Chicken Salad";
  }
  caloriesConsumed = 1200;
  calorieGoal = 2000;
  get caloriesPercent(): number {
    return (this.caloriesConsumed / this.calorieGoal) * 100;
  }

  goalTitle = "Lose 5 lbs";
  goalPercent = 40;

}
