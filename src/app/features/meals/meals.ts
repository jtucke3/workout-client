import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MealService } from '../../shared/services/meal.service';
import { AuthUserService } from '../../shared/services/auth-user.service';
import {
  CreateMealRequestWebVo,
  UpdateMealRequestWebVo
} from '../../shared/models/meal-api.models';

@Component({
  selector: 'app-meals',
  imports: [Navbar, FormsModule, CommonModule],
  templateUrl: './meals.html',
  styleUrl: './meals.scss'
})
export class Meals implements OnInit {

  private mealService = inject(MealService);
  private authUser = inject(AuthUserService);

  meals = signal<{ id: string; name: string; calories: number; time: Date; notes: string | null }[]>([]);
  caloriesConsumed = signal(0);
  calorieGoal = 2000;

  showAddMeal = signal(false);
  editingIndex: number | null = null;
  deletingId = signal<string | null>(null);

  newMealName = signal('');
  newMealCalories = signal(0);
  newMealNotes = signal('');

  constructor() {
    effect(() => {
      const user = this.authUser.user();
      const resolvedUserId = user?.id ?? this.getLastUserId();

      // Load from cache immediately for perceived persistence on refresh
      if (resolvedUserId) {
        const cached = this.loadMealsFromCache(resolvedUserId);
        if (cached) {
          this.meals.set(cached);
          this.recalculateCalories();
        }

        // Load per-user calorie goal if present
        const cachedGoal = this.loadGoalFromCache(resolvedUserId);
        if (cachedGoal != null) {
          this.calorieGoal = cachedGoal;
        }
      }

      // If we have an active user, refresh from backend and update cache
      if (user?.id) {
        this.setLastUserId(user.id);
        const cachedGoal = this.loadGoalFromCache(user.id);
        if (cachedGoal != null) {
          this.calorieGoal = cachedGoal;
        }
        this.loadMeals(user.id);
      }
    });
  }

  ngOnInit() {
  }

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

  async saveMeal() {
    const user = this.authUser.user();
    const userId = this.resolveUserId();
    if (!userId) {
      console.warn('No userId found to save meal');
      return;
    }

    if (!this.newMealName() || !this.newMealCalories()) return;

    const nowIso = new Date().toISOString();

    try {
      if (this.editingIndex !== null) {
        // UPDATE
        const existing = this.meals()[this.editingIndex];

        const payload: UpdateMealRequestWebVo = {
          mealId: existing.id,
          userId: userId,
          name: this.newMealName(),
          calories: this.newMealCalories(),
          mealAtUtc: nowIso,
          notes: this.newMealNotes()
        };

        const updated = await this.mealService.updateMeal(payload);

        const updatedMeals = [...this.meals()];
        updatedMeals[this.editingIndex] = {
          id: updated.mealId,
          name: updated.name,
          calories: updated.calories,
          notes: updated.notes,
          time: new Date(updated.mealAtUtc)
        };

        this.meals.set(updatedMeals);
        this.saveMealsToCache(userId, this.meals());

      } else {
        // CREATE
        const payload: CreateMealRequestWebVo = {
          userId: userId,
          name: this.newMealName(),
          calories: this.newMealCalories(),
          mealAtUtc: nowIso,
          notes: this.newMealNotes()
        };

        const created = await this.mealService.createMeal(payload);

        this.meals.set([
          ...this.meals(),
          {
            id: created.mealId,
            name: created.name,
            calories: created.calories,
            notes: created.notes,
            time: new Date(created.mealAtUtc)
          }
        ]);
        this.saveMealsToCache(userId, this.meals());
      }

      this.recalculateCalories();
      this.cancelMeal();

    } catch (err) {
      console.error('Failed to save meal:', err);
    }
  }

  editMeal(mealId: string) {
    const index = this.meals().findIndex(m => m.id === mealId);
    if (index < 0) return;
    const meal = this.meals()[index];
    this.editingIndex = index;
    this.newMealName.set(meal.name);
    this.newMealCalories.set(meal.calories);
    this.newMealNotes.set(meal.notes ?? '');
    this.showAddMeal.set(true);
  }
  

  async deleteMeal(mealId: string) {
    console.debug('Delete clicked for mealId:', mealId);
    const index = this.meals().findIndex(m => m.id === mealId);
    if (index < 0) return;
    const meal = this.meals()[index];
    const userId = this.resolveUserId();
    if (!userId) return;
    try {
      this.deletingId.set(mealId);
      await this.mealService.deleteMeal(userId, meal.id);
      // Refetch the user's meals to ensure UI stays in sync
      await this.loadMeals(userId);
    } catch (err) {
      console.error('Failed to delete meal:', err);
    }
    finally {
      this.deletingId.set(null);
    }
  }

  recalculateCalories() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mealsToday = this.meals().filter(meal => {
    return meal.time.getTime() >= today.getTime();
  });
  const total = mealsToday.reduce((sum, m) => sum + m.calories, 0);
  this.caloriesConsumed.set(total);
}

  cancelMeal() {
    this.showAddMeal.set(false);
    this.editingIndex = null;
    this.newMealName.set('');
    this.newMealCalories.set(0);
    this.newMealNotes.set('');
  }

  // -- Local persistence helpers --
  private getLastUserId(): string | null {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem('lastUserId'); } catch { return null; }
  }

  private setLastUserId(userId: string): void {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('lastUserId', userId); } catch {}
  }

  private cacheKey(userId: string): string { return `meals_${userId}`; }
  private goalKey(userId: string): string { return `calorieGoal_${userId}`; }

  private saveMealsToCache(userId: string, meals: { id: string; name: string; calories: number; time: Date; notes: string | null }[]): void {
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

  private loadMealsFromCache(userId: string): { id: string; name: string; calories: number; time: Date; notes: string | null }[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.cacheKey(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id: string; name: string; calories: number; mealAtUtc: string; notes: string | null }[];
      return parsed.map(p => ({ id: p.id, name: p.name, calories: p.calories, time: new Date(p.mealAtUtc), notes: p.notes }));
    } catch {
      return null;
    }
  }

  private resolveUserId(): string | null {
    return this.authUser.user()?.id ?? this.getLastUserId();
  }

  // -- Goal edit/persist --
  showGoalEditor = signal(false);
  goalInput = signal<number | null>(null);

  openGoalEditor() {
    this.goalInput.set(this.calorieGoal);
    this.showGoalEditor.set(true);
  }

  saveGoal() {
    const userId = this.resolveUserId();
    if (!userId) {
      this.showGoalEditor.set(false);
      return;
    }
    const val = this.goalInput();
    const safe = typeof val === 'number' && !isNaN(val) && val > 0 ? Math.round(val) : this.calorieGoal;
    this.calorieGoal = safe;
    this.saveGoalToCache(userId, safe);
    this.showGoalEditor.set(false);
  }

  cancelGoalEdit() {
    this.showGoalEditor.set(false);
    this.goalInput.set(null);
  }

  private saveGoalToCache(userId: string, goal: number): void {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(this.goalKey(userId), String(goal)); } catch {}
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
}
