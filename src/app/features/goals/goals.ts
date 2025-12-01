import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../shared/components/navbar/navbar';
import { UnitService } from '../../shared/services/unit.service';
import { AuthUserService } from '../../shared/services/auth-user.service';

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'weight-loss' | 'weight-gain' | 'strength' | 'endurance' | 'habit' | 'custom';
  targetValue?: number | null;
  currentValue: number;
  unit?: string;
  targetDate: string;
  icon?: string;
  status: GoalStatus;
  progress: number; // 0–100
}

@Component({
  standalone: true,
  selector: 'app-goals',
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  templateUrl: './goals.html',
  styleUrls: ['./goals.scss']
})
export class Goals {
  private fb = inject(FormBuilder);
  private unitService = inject(UnitService);
  private authUser = inject(AuthUserService);

  goals = signal<Goal[]>([
    {
      id: '1',
      title: 'Lose 5 lbs',
      description: 'Gradually lose 5 pounds over the next month.',
      type: 'weight-loss',
      targetValue: 5,
      currentValue: 1,
      unit: 'lb',
      targetDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10),
      icon: '⚖️',
      status: 'active',
      progress: 20
    },
    {
      id: '2',
      title: 'Bench 225 lbs',
      description: 'Reach a 225 lb bench press for 5 reps.',
      type: 'strength',
      targetValue: 225,
      currentValue: 185,
      unit: 'lb',
      targetDate: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().slice(0, 10),
      icon: '🏋️‍♂️',
      status: 'active',
      progress: 65
    },
    {
      id: '3',
      title: 'Run 5K under 25 minutes',
      description: 'Improve your 5K time to under 25 minutes.',
      type: 'endurance',
      targetValue: 25,
      currentValue: 28,
      unit: 'min',
      targetDate: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString().slice(0, 10),
      icon: '🏃‍♂️',
      status: 'paused',
      progress: 40
    }
  ]);

  selectedFilter = signal<'all' | 'active' | 'paused' | 'completed'>('all');

  showCreateForm = signal(false);
  editingGoal = signal<Goal | null>(null);

  currentWeightFromBackend = signal<number | null>(null);
  isLoadingWeight = signal(false);

  goalTypes: { value: Goal['type']; label: string; icon: string }[] = [
    { value: 'weight-loss', label: 'Weight Loss', icon: '⚖️' },
    { value: 'weight-gain', label: 'Weight Gain', icon: '🍗' },
    { value: 'strength', label: 'Strength', icon: '🏋️‍♂️' },
    { value: 'endurance', label: 'Endurance', icon: '🏃‍♂️' },
    { value: 'habit', label: 'Habit Building', icon: '📅' },
    { value: 'custom', label: 'Custom', icon: '🎯' }
  ];

  goalForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    type: ['weight-loss' as Goal['type'], Validators.required],
    targetValue: [null as number | null],
    currentValue: [0, Validators.required],
    unit: [''],
    targetDate: ['', Validators.required]
  });

  constructor() {
    this.loadCurrentWeight();
  }

  // ---- Unit / weight helpers ----

  get unitSymbol(): string {
    return this.unitService.getSymbol();
  }

  get preferredWeightUnit(): string {
    return this.unitService.getSymbol();
  }

  get isWeightGoal(): boolean {
    const type = this.goalForm.get('type')?.value;
    return type === 'weight-loss' || type === 'weight-gain';
  }

  async loadCurrentWeight() {
    this.isLoadingWeight.set(true);

    try {
      const user = this.authUser.user();

      if (!user || typeof user.weight !== 'number' || Number.isNaN(user.weight)) {
        this.currentWeightFromBackend.set(null);
        return;
      }

      const preferredUnit = this.unitService.getPreferredUnit();
      const converted = this.unitService.convertWeight(user.weight, 'POUNDS', preferredUnit);

      this.currentWeightFromBackend.set(converted);

      const type = this.goalForm.get('type')?.value;
      if (type === 'weight-loss' || type === 'weight-gain') {
        this.goalForm.patchValue({
          currentValue: converted,
          unit: this.unitSymbol
        });
      }
    } finally {
      this.isLoadingWeight.set(false);
    }
  }

  // ---- Filtering / tabs ----

  private isValidFilter(filter: string): filter is 'all' | 'active' | 'paused' | 'completed' {
    return filter === 'all' || filter === 'active' || filter === 'paused' || filter === 'completed';
  }

  setFilter(filter: 'all' | 'active' | 'paused' | 'completed' | string) {
    if (!this.isValidFilter(filter)) return;
    this.selectedFilter.set(filter);
  }

  getFilterCount(filter: 'all' | 'active' | 'paused' | 'completed' | string): number {
    if (!this.isValidFilter(filter)) return 0;
    const goals = this.goals();
    if (filter === 'all') return goals.length;
    return goals.filter(g => g.status === filter).length;
  }

  get filteredGoals(): Goal[] {
    const filter = this.selectedFilter();
    const all = this.goals();
    if (filter === 'all') return all;
    return all.filter(g => g.status === filter);
  }

  // ---- Create/edit form ----

  openCreateForm() {
    this.editingGoal.set(null);
    this.goalForm.reset({
      title: '',
      description: '',
      type: 'weight-loss',
      targetValue: null,
      currentValue: this.currentWeightFromBackend() ?? 0,
      unit: this.unitSymbol,
      targetDate: ''
    });
    this.showCreateForm.set(true);
  }

  closeCreateForm() {
    this.showCreateForm.set(false);
    this.editingGoal.set(null);
  }

  onGoalTypeChange() {
    if (this.isWeightGoal && this.currentWeightFromBackend() !== null) {
      this.goalForm.patchValue({
        currentValue: this.currentWeightFromBackend() ?? 0,
        unit: this.unitSymbol
      });
    }
  }

  saveGoal() {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const { title, description, type, targetValue, currentValue, unit, targetDate } =
      this.goalForm.getRawValue();

    const existing = this.editingGoal();
    const base: Partial<Goal> = {
      title: title || 'Untitled Goal',
      description: description || '',
      type: (type || 'custom') as Goal['type'],
      targetValue: targetValue ?? null,
      currentValue: currentValue ?? 0,
      unit: unit || this.unitSymbol,
      targetDate: targetDate || new Date().toISOString().slice(0, 10),
      icon: this.getTypeIcon((type || 'custom') as Goal['type'])
    };

    if (existing) {
      const updated: Goal = {
        ...existing,
        ...base,
        progress: this.computeProgress(
          base.currentValue ?? 0,
          base.targetValue ?? null,
          existing.type
        ),
      };

      this.goals.update(list => list.map(g => g.id === existing.id ? updated : g));
    } else {
      const newGoal: Goal = {
        id: Math.random().toString(36).substring(2),
        title: base.title!,
        description: base.description!,
        type: base.type as Goal['type'],
        targetValue: base.targetValue,
        currentValue: base.currentValue ?? 0,
        unit: base.unit,
        targetDate: base.targetDate!,
        icon: base.icon,
        status: 'active',
        progress: this.computeProgress(
          base.currentValue ?? 0,
          base.targetValue ?? null,
          base.type as Goal['type']
        )
      };

      this.goals.update(list => [...list, newGoal]);
    }

    this.closeCreateForm();
  }

  editGoal(goal: Goal) {
    this.editingGoal.set(goal);
    this.goalForm.setValue({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.targetValue ?? null,
      currentValue: goal.currentValue,
      unit: goal.unit || this.unitSymbol,
      targetDate: goal.targetDate
    });
    this.showCreateForm.set(true);
  }

  // ---- Goal actions ----

  toggleGoalStatus(goal: Goal) {
    this.goals.update(list =>
      list.map(g => {
        if (g.id !== goal.id) return g;
        let next: GoalStatus;
        if (g.status === 'active') next = 'paused';
        else if (g.status === 'paused') next = 'active';
        else next = 'active'; // completed -> active
        return { ...g, status: next };
      })
    );
  }

  deleteGoal(id: string) {
    this.goals.update(list => list.filter(g => g.id !== id));
  }

  updateGoalProgress(goal: Goal, rawValue: string | number | null) {
    const parsed = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;
    if (parsed == null || Number.isNaN(parsed)) return;

    this.goals.update(list =>
      list.map(g => {
        if (g.id !== goal.id) return g;
        const currentValue = parsed;
        const progress = this.computeProgress(currentValue, g.targetValue ?? null, g.type);
        return { ...g, currentValue, progress };
      })
    );
  }

  // ---- Display helpers ----

  getTypeIcon(type: Goal['type']): string {
    return this.goalTypes.find(t => t.value === type)?.icon || '🎯';
  }

  getTypeLabel(type: Goal['type']): string {
    return this.goalTypes.find(t => t.value === type)?.label || 'Custom';
  }

  getDaysUntilTarget(targetDate: string): number {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getProgressColor(progress: number): string {
    if (progress >= 90) return '#22c55e';   // green
    if (progress >= 60) return '#eab308';   // amber
    if (progress >= 30) return '#f97316';   // orange
    return '#ef4444';                       // red
  }

  // ---- Internal math helpers ----

  private computeProgress(currentValue: number, targetValue: number | null, type: Goal['type']): number {
    if (!targetValue || targetValue <= 0) return 0;

    let ratio = currentValue / targetValue;

    if (type === 'weight-loss') {
      // could refine later; for now same ratio calculation
      ratio = currentValue / targetValue;
    }

    const pct = Math.max(0, Math.min(1, ratio)) * 100;
    return Number.isFinite(pct) ? pct : 0;
  }
}
