import { Component, signal } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meals',
  imports: [Navbar, FormsModule, CommonModule],
  templateUrl: './meals.html',
  styleUrl: './meals.scss'
})
export class Meals {
  meals = signal<{ name: string; calories: number; time: Date; notes?: string }[]>([]);
  caloriesConsumed = signal(0);
  calorieGoal = 2000;

  showAddMeal = signal(false);
  editingIndex: number | null = null;

  newMealName = signal('');
  newMealCalories = signal(0);
  newMealNotes = signal('');

  get caloriesPercent() {
    return Math.min((this.caloriesConsumed() / this.calorieGoal) * 100, 100);
  }

  saveMeal() {
    if (!this.newMealName() || !this.newMealCalories()) return;

    const meal = {
      name: this.newMealName(),
      calories: this.newMealCalories(),
      notes: this.newMealNotes(),
      time: new Date()
    };

    if (this.editingIndex !== null) {
      const updated = [...this.meals()];
      const oldCalories = updated[this.editingIndex].calories;
      updated[this.editingIndex] = meal;
      this.meals.set(updated);
      this.caloriesConsumed.set(this.caloriesConsumed() - oldCalories + meal.calories);
    } else {
      this.meals.set([...this.meals(), meal]);
      this.caloriesConsumed.set(this.caloriesConsumed() + meal.calories);
    }

    this.cancelMeal();
  }

  editMeal(index: number) {
    const meal = this.meals()[index];
    this.editingIndex = index;
    this.newMealName.set(meal.name);
    this.newMealCalories.set(meal.calories);
    this.newMealNotes.set(meal.notes || '');
    this.showAddMeal.set(true);
  }

  deleteMeal(index: number) {
    const meal = this.meals()[index];
    this.caloriesConsumed.set(this.caloriesConsumed() - meal.calories);
    const updated = [...this.meals()];
    updated.splice(index, 1);
    this.meals.set(updated);
  }

  cancelMeal() {
    this.showAddMeal.set(false);
    this.editingIndex = null;
    this.newMealName.set('');
    this.newMealCalories.set(0);
    this.newMealNotes.set('');
  }
}
