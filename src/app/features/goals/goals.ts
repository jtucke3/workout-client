import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../shared/components/navbar/navbar';
import { UnitService } from '../../shared/services/unit.service';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'weight-loss' | 'weight-gain' | 'strength' | 'endurance' | 'habit' | 'custom';
  targetValue?: number;
  currentValue: number;
  unit?: string;
  targetDate: string;
  status: 'active' | 'completed' | 'paused';
  createdDate: string;
  progress: number; // percentage
}

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  templateUrl: './goals.html',
  styleUrl: './goals.scss'
})
export class Goals {
  private fb = inject(FormBuilder);
  private unitService = inject(UnitService);

  goals = signal<Goal[]>([
    {
      id: '1',
      title: 'Lose 20 pounds',
      description: 'Reach my target weight for summer',
      type: 'weight-loss',
      targetValue: 20,
      currentValue: 8,
      unit: 'lbs',
      targetDate: '2025-06-01',
      status: 'active',
      createdDate: '2025-01-15',
      progress: 40
    },
    {
      id: '2',
      title: 'Bench Press 200 lbs',
      description: 'Increase bench press strength',
      type: 'strength',
      targetValue: 200,
      currentValue: 165,
      unit: 'lbs',
      targetDate: '2025-08-01',
      status: 'active',
      createdDate: '2025-02-01',
      progress: 82.5
    },
    {
      id: '3',
      title: 'Daily 10k steps',
      description: 'Walk 10,000 steps every day',
      type: 'habit',
      targetValue: 10000,
      currentValue: 7500,
      unit: 'steps',
      targetDate: '2025-12-31',
      status: 'active',
      createdDate: '2025-01-01',
      progress: 75
    }
  ]);

  showCreateForm = signal(false);
  editingGoal = signal<Goal | null>(null);
  selectedFilter = signal<'all' | 'active' | 'completed' | 'paused'>('all');
  currentWeightFromBackend = signal<number | null>(null);
  isLoadingWeight = signal(false);

  goalForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    type: ['custom', [Validators.required]],
    targetValue: [null as number | null],
    currentValue: [0, [Validators.required, Validators.min(0)]],
    unit: [''],
    targetDate: ['', [Validators.required]]
  });

  get filteredGoals() {
    const filter = this.selectedFilter();
    return this.goals().filter(goal => filter === 'all' || goal.status === filter);
  }

  getFilterCount(filter: 'all' | 'active' | 'completed' | 'paused' | string): number {
    const filterType = filter as 'all' | 'active' | 'completed' | 'paused';
    if (filterType === 'all') {
      return this.goals().length;
    }
    return this.goals().filter(goal => goal.status === filterType).length;
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter as 'all' | 'active' | 'completed' | 'paused');
  }

  onGoalTypeChange() {
    const goalType = this.goalForm.get('type')?.value;
    const preferredUnit = this.unitService.getPreferredUnit() === 'POUNDS' ? 'lbs' : 'kg';
    
    if (goalType === 'weight-loss' || goalType === 'weight-gain') {
      // Auto-fill with current weight and preferred unit for weight goals
      const currentWeight = this.currentWeightFromBackend() || 0;
      this.goalForm.patchValue({ 
        unit: preferredUnit,
        currentValue: currentWeight
      });
    } else {
      // Clear or set appropriate defaults for other goal types
      const unitDefaults: Record<string, string> = {
        'strength': 'lbs',
        'endurance': 'minutes',
        'habit': 'count'
      };
      
      this.goalForm.patchValue({ 
        unit: goalType ? (unitDefaults[goalType] || '') : '',
        currentValue: 0
      });
    }
  }

  get goalTypes() {
    return [
      { value: 'weight-loss', label: 'Weight Loss', icon: '📉' },
      { value: 'weight-gain', label: 'Weight Gain', icon: '📈' },
      { value: 'strength', label: 'Strength', icon: '💪' },
      { value: 'endurance', label: 'Endurance', icon: '🏃‍♂️' },
      { value: 'habit', label: 'Habit', icon: '✅' },
      { value: 'custom', label: 'Custom', icon: '🎯' }
    ];
  }

  openCreateForm() {
    this.showCreateForm.set(true);
    this.loadCurrentWeight();
    const preferredUnit = this.unitService.getPreferredUnit() === 'POUNDS' ? 'lbs' : 'kg';
    
    this.goalForm.reset({
      title: '',
      description: '',
      type: 'custom',
      targetValue: null,
      currentValue: 0,
      unit: preferredUnit,
      targetDate: ''
    });
  }

  async loadCurrentWeight() {
    this.isLoadingWeight.set(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/user/weight', { headers });
      if (response.ok) {
        const data = await response.json();
        const weightInPounds = data.weight || data.currentWeight || 0;
        
        // Convert to user's preferred unit
        const preferredUnit = this.unitService.getPreferredUnit();
        const convertedWeight = this.unitService.convertWeight(weightInPounds, 'POUNDS', preferredUnit);
        
        this.currentWeightFromBackend.set(convertedWeight);
        
        // Auto-fill current value for weight-related goals
        const goalType = this.goalForm.get('type')?.value;
        if (goalType === 'weight-loss' || goalType === 'weight-gain') {
          this.goalForm.patchValue({ currentValue: convertedWeight });
        }
      }
    } catch (error) {
      console.error('Failed to load current weight:', error);
      // Fallback - use default weight or leave empty
      this.currentWeightFromBackend.set(null);
    } finally {
      this.isLoadingWeight.set(false);
    }
  }

  get preferredWeightUnit(): string {
    return this.unitService.getSymbol();
  }

  get isWeightGoal(): boolean {
    const goalType = this.goalForm.get('type')?.value;
    return goalType === 'weight-loss' || goalType === 'weight-gain';
  }

  closeCreateForm() {
    this.showCreateForm.set(false);
    this.editingGoal.set(null);
  }

  editGoal(goal: Goal) {
    this.editingGoal.set(goal);
    this.showCreateForm.set(true);
    this.goalForm.patchValue({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      unit: goal.unit,
      targetDate: goal.targetDate
    });
  }

  saveGoal() {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    const formValue = this.goalForm.getRawValue();
    const editingGoal = this.editingGoal();
    
    if (editingGoal) {
      // Update existing goal
      const updatedGoal: Goal = {
        ...editingGoal,
        title: formValue.title!,
        description: formValue.description || '',
        type: formValue.type as Goal['type'],
        targetValue: formValue.targetValue || undefined,
        currentValue: formValue.currentValue!,
        unit: formValue.unit || '',
        targetDate: formValue.targetDate!,
        progress: this.calculateProgress(
          formValue.currentValue!,
          formValue.targetValue || 0,
          formValue.type as Goal['type']
        )
      };
      
      this.goals.update(goals => 
        goals.map(g => g.id === editingGoal.id ? updatedGoal : g)
      );
    } else {
      // Create new goal
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: formValue.title!,
        description: formValue.description || '',
        type: formValue.type as Goal['type'],
        targetValue: formValue.targetValue || undefined,
        currentValue: formValue.currentValue!,
        unit: formValue.unit || '',
        targetDate: formValue.targetDate!,
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0],
        progress: this.calculateProgress(
          formValue.currentValue!,
          formValue.targetValue || 0,
          formValue.type as Goal['type']
        )
      };
      
      this.goals.update(goals => [...goals, newGoal]);
    }

    this.closeCreateForm();
  }

  deleteGoal(goalId: string) {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.goals.update(goals => goals.filter(g => g.id !== goalId));
    }
  }

  updateGoalProgress(goal: Goal, newValue: number) {
    const updatedGoal = {
      ...goal,
      currentValue: newValue,
      progress: this.calculateProgress(newValue, goal.targetValue || 0, goal.type)
    };
    
    // Auto-complete goal if target is reached
    if (updatedGoal.progress >= 100 && goal.status === 'active') {
      updatedGoal.status = 'completed';
    }
    
    this.goals.update(goals => 
      goals.map(g => g.id === goal.id ? updatedGoal : g)
    );
  }

  toggleGoalStatus(goal: Goal) {
    const newStatus = goal.status === 'active' ? 'paused' : 'active';
    this.goals.update(goals => 
      goals.map(g => g.id === goal.id ? { ...g, status: newStatus } : g)
    );
  }

  private calculateProgress(current: number, target: number, type: Goal['type']): number {
    if (!target || target === 0) return 0;
    
    // For weight loss, progress is inverse (losing weight increases progress)
    if (type === 'weight-loss') {
      return Math.min(100, Math.max(0, (current / target) * 100));
    }
    
    // For other goals, progress is direct
    return Math.min(100, Math.max(0, (current / target) * 100));
  }

  getProgressColor(progress: number): string {
    if (progress >= 100) return '#10b981'; // green
    if (progress >= 75) return '#3b82f6'; // blue
    if (progress >= 50) return '#f59e0b'; // orange
    return '#ef4444'; // red
  }

  getDaysUntilTarget(targetDate: string): number {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTypeIcon(type: Goal['type']): string {
    return this.goalTypes.find(t => t.value === type)?.icon || '🎯';
  }

  getTypeLabel(type: Goal['type']): string {
    return this.goalTypes.find(t => t.value === type)?.label || 'Custom';
  }
}
