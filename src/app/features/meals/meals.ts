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

  newMealName = signal('');
  newMealCalories = signal(0);
  newMealNotes = signal('');

  constructor() {
    effect(() => {
      const user = this.authUser.user();
      if (user?.email) {
        this.loadMeals(user.email);
      }
    });
  }

  ngOnInit() {
  }

  async loadMeals(email: string) {
    try {
      const data = await this.mealService.getMeals(email);
      this.meals.set(
        data.map(m => ({
          id: m.id,
          name: m.name,
          calories: m.calories,
          time: new Date(m.mealAtUtc),
          notes: m.notes
        }))
      );
      this.recalculateCalories();
    } catch (err) {
      console.error('Failed to load meals:', err);
    }
  }

  get caloriesPercent() {
    return Math.min((this.caloriesConsumed() / this.calorieGoal) * 100, 100);
  }

  async saveMeal() {
    const user = this.authUser.user();
    if (!user?.email) return; // guard

    if (!this.newMealName() || !this.newMealCalories()) return;

    const nowIso = new Date().toISOString();

    try {
      if (this.editingIndex !== null) {
        // UPDATE
        const existing = this.meals()[this.editingIndex];

        const payload: UpdateMealRequestWebVo = {
          mealId: existing.id,
          name: this.newMealName(),
          calories: this.newMealCalories(),
          mealAtUtc: nowIso,
          notes: this.newMealNotes()
        };

        const updated = await this.mealService.updateMeal(payload);

        const updatedMeals = [...this.meals()];
        updatedMeals[this.editingIndex] = {
          id: updated.id,
          name: updated.name,
          calories: updated.calories,
          notes: updated.notes,
          time: new Date(updated.mealAtUtc)
        };

        this.meals.set(updatedMeals);

      } else {
        // CREATE
        const payload: CreateMealRequestWebVo = {
          userEmail: user?.email,
          name: this.newMealName(),
          calories: this.newMealCalories(),
          mealAtUtc: nowIso,
          notes: this.newMealNotes()
        };

        const created = await this.mealService.createMeal(payload);

        this.meals.set([
          ...this.meals(),
          {
            id: created.id,
            name: created.name,
            calories: created.calories,
            notes: created.notes,
            time: new Date(created.mealAtUtc)
          }
        ]);
      }

      this.recalculateCalories();
      this.cancelMeal();

    } catch (err) {
      console.error('Failed to save meal:', err);
    }
  }

  editMeal(index: number) {
    const meal = this.meals()[index];
    this.editingIndex = index;
    this.newMealName.set(meal.name);
    this.newMealCalories.set(meal.calories);
    this.newMealNotes.set(meal.notes ?? '');
    this.showAddMeal.set(true);
  }
  

  async deleteMeal(index: number) {
    const meal = this.meals()[index];
    try {
      await this.mealService.deleteMeal(meal.id);
      const updated = [...this.meals()];
      updated.splice(index, 1);
      this.meals.set(updated);
      this.recalculateCalories();
    } catch (err) {
      console.error('Failed to delete meal:', err);
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
}
