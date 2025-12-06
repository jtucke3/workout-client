import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/components/navbar/navbar';
import { AuthUserService } from '../../shared/services/auth-user.service';
import { MealService } from '../../shared/services/meal.service';
import { UnitService } from '../../shared/services/unit.service';
import { FriendsService } from '../friends/friendsService/friends.service';
import { FriendPreviewWebVo } from '../friends/friendsModels/friends-api.models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private authUser = inject(AuthUserService);
  private mealService = inject(MealService);
  private unitService = inject(UnitService);
  private friendsService = inject(FriendsService);

  user = this.authUser.user;

  // ------ Meals & calories ------
  meals = signal<{ id: string; name: string; calories: number; time: Date; notes: string | null }[]>([]);
  caloriesConsumed = signal(0);
  calorieGoal = 2000;

  constructor() {
    effect(() => {
      const user = this.authUser.user();
      const resolvedUserId = user?.id ?? this.getLastUserId();

      if (resolvedUserId) {
        // Load meals & goal immediately from cache
        const cached = this.loadMealsFromCache(resolvedUserId);
        if (cached) {
          this.meals.set(cached);
          this.recalculateCalories();
        }
      }

      // Refresh from backend when user resolves
      if (user?.id) {
        this.setLastUserId(user.id);
        this.loadMeals(user.id);
        this.loadFriendsPreview();
      }
    });
  }

  ngOnInit() {}

  async loadMeals(userId: string) {
    try {
      const data = await this.mealService.getMeals(userId);
      this.meals.set(
        data.map(m => ({
          id: m.mealId,
          name: m.name,
          calories: m.calories,
          time: new Date(m.mealAtUtc),
          notes: m.notes
        }))
      );
      this.recalculateCalories();
      this.saveMealsToCache(userId, this.meals());
    } catch (err) {
      console.error('Failed to load meals:', err);
    }
  }

  get caloriesPercent() {
    return Math.min((this.caloriesConsumed() / this.calorieGoal) * 100, 100);
  }

  get goalMet() {
    return this.caloriesConsumed() >= this.calorieGoal;
  }

  get caloriesRemaining() {
    return Math.max(this.calorieGoal - this.caloriesConsumed(), 0);
  }

  recalculateCalories() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mealsToday = this.meals().filter(meal => meal.time.getTime() >= today.getTime());
    const total = mealsToday.reduce((sum, m) => sum + m.calories, 0);
    this.caloriesConsumed.set(total);
  }


  // ----------------------------
  // Local Storage Helpers
  // ----------------------------
  private getLastUserId(): string | null {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem('lastUserId'); } catch { return null; }
  }

  private setLastUserId(userId: string) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('lastUserId', userId); } catch {}
  }

  private cacheKey(userId: string) { return `meals_${userId}`; }
  private goalKey(userId: string) { return `calorieGoal_${userId}`; }

  private saveMealsToCache(
    userId: string,
    meals: { id: string; name: string; calories: number; time: Date; notes: string | null }[]
  ) {
    if (typeof window === 'undefined') return;
    try {
      const serializable = meals.map(m => ({
        id: m.id,
        name: m.name,
        calories: m.calories,
        mealAtUtc: m.time.toISOString(),
        notes: m.notes ?? null
      }));
      localStorage.setItem(this.cacheKey(userId), JSON.stringify(serializable));
    } catch {}
  }

  private loadMealsFromCache(userId: string) {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.cacheKey(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.map((p: any) => ({
        id: p.id,
        name: p.name,
        calories: p.calories,
        time: new Date(p.mealAtUtc),
        notes: p.notes
      }));
    } catch {
      return null;
    }
  }

  private loadGoalFromCache(userId: string): number | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.goalKey(userId));
      if (!raw) return null;
      const parsed = Number(raw);
      return isNaN(parsed) ? null : parsed;
    } catch { return null; }
  }

  private _friendsPreview = signal<FriendPreviewWebVo[]>([]);
  friendsPreview = this._friendsPreview.asReadonly();

  async loadFriendsPreview(): Promise<void> {
    try {
      const allFriends = await this.friendsService.listFriends();
      this._friendsPreview.set(allFriends.slice(0, 3)); // only 3 friends
    } catch (err) {
      console.error('Failed to load friends preview', err);
      this._friendsPreview.set([]);
    }
  }


  weightInPounds = 180;

  get displayedWeight(): number {
    const preferredUnit = this.unitService.getPreferredUnit();
    return this.unitService.convertWeight(this.weightInPounds, 'POUNDS', preferredUnit);
  }

  get weightSymbol(): string {
    return this.unitService.getSymbol();
  }
}
