import { Component, signal, inject } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthUserService } from '../../shared/services/auth-user.service';

// Inline minimal interfaces (keep local as requested)
interface SetResponseWebVo { setId: string; weight: number; reps: number; createdAt: string; }
interface ExerciseResponseWebVo { id: string; name: string; notes?: string | null; equipment?: string | null; bodyPart?: string | null; createdAt: string; sets: SetResponseWebVo[]; }
interface WorkoutResponseWebVo { id: string; title: string; notes?: string | null; workoutAt: string; createdAt: string; exercises: ExerciseResponseWebVo[]; }

@Component({
  selector: 'app-workouts',
  imports: [Navbar, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './workouts.html',
  styleUrl: './workouts.scss'
})
export class Workouts {
  private http = inject(HttpClient);
  private authUser = inject(AuthUserService);
  // Signals for state (logic added later)
  workout = signal<WorkoutResponseWebVo | null>(null);
  workoutsList = signal<WorkoutResponseWebVo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showCreateModal = signal(false);
  // When true, UI emphasizes rapid logging (newly created workout or manually entered)
  loggingMode = signal(false);

  // Per-exercise temporary set input state (weight/reps before adding set)
  pendingSetInputs = signal<Record<string, { weight: number; reps: number }>>({});

  // Form state for creating workout
  createTitle = signal('');
  createDate = signal(this.defaultDateTime());
  createNotes = signal('');

  // Form state for adding exercise
  exName = signal('');
  exEquipment = signal('');
  exBodyPart = signal('');
  exNotes = signal('');

  private defaultDateTime(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private headers(): HttpHeaders {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
    const init: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) init['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(init);
  }

  private userId(): string | null {
    // Try stored userId first then signal
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('userId') || sessionStorage.getItem('userId')) : null;
    if (stored) return stored;
    const user = this.authUser.user();
    return user?.id || null;
  }

  async createWorkout(): Promise<void> {
    const uid = this.userId();
    if (!uid) {
      this.error.set('No user id found. Login first.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const body = {
      title: this.createTitle().trim() || 'Untitled Workout',
      workoutAt: this.createDate(),
      notes: this.createNotes().trim() || null
    };
    try {
      const w = await this.http.post<WorkoutResponseWebVo>(`/api/workouts?userId=${encodeURIComponent(uid)}`, body, { headers: this.headers() }).toPromise();
      this.workout.set(w || null);
      this.showCreateModal.set(false);
      if (w) {
        this.workoutsList.set([w, ...this.workoutsList()]);
        // Enable logging mode immediately for fresh workout
        this.loggingMode.set(true);
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to create workout');
    } finally {
      this.loading.set(false);
    }
  }

  async loadWorkouts(): Promise<void> {
    const uid = this.userId();
    if (!uid) return;
    try {
      const list = await this.http.get<WorkoutResponseWebVo[]>(`/api/workouts?userId=${encodeURIComponent(uid)}`, { headers: this.headers() }).toPromise();
      this.workoutsList.set(list || []);
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load workouts');
    }
  }

  viewWorkout(w: WorkoutResponseWebVo): void {
    this.workout.set(w);
    // Enter logging mode if workout has no exercises yet (likely actively logging)
    this.loggingMode.set(w.exercises.length === 0);
  }

  backToList(): void {
    this.workout.set(null);
    this.loggingMode.set(false);
  }

  // lifecycle-like init (standalone component, no ngOnInit imported)
  constructor() {
    // attempt initial load if user id present
    setTimeout(() => this.loadWorkouts(), 0);
  }

  async addExercise(): Promise<void> {
    const w = this.workout();
    if (!w) return;
    if (!this.exName().trim()) {
      this.error.set('Exercise name required');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const body = {
      name: this.exName().trim(),
      notes: this.exNotes().trim() || '',
      equipment: this.exEquipment().trim() || '',
      bodyPart: this.exBodyPart().trim() || ''
    };
    try {
      const updated = await this.http.post<WorkoutResponseWebVo>(`/api/workouts/${w.id}/exercises`, body, { headers: this.headers() }).toPromise();
      if (updated) this.workout.set(updated);
      this.exName.set(''); this.exEquipment.set(''); this.exBodyPart.set(''); this.exNotes.set('');
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to add exercise');
    } finally {
      this.loading.set(false);
    }
  }

  async addSet(ex: ExerciseResponseWebVo): Promise<void> {
    const w = this.workout();
    if (!w) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const updatedEx = await this.http.post<ExerciseResponseWebVo>(`/api/workouts/${w.id}/exercises/${ex.id}/sets`, {}, { headers: this.headers() }).toPromise();
      if (updatedEx) this.replaceExercise(updatedEx);
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to add set');
    } finally {
      this.loading.set(false);
    }
  }

  // Quick add set with initial weight/reps: create empty set then update values
  async quickAddSet(ex: ExerciseResponseWebVo): Promise<void> {
    const w = this.workout();
    if (!w) return;
    const inputs = this.pendingSetInputs()[ex.id] || { weight: 0, reps: 0 };
    this.loading.set(true);
    this.error.set(null);
    try {
      // Create new set (empty)
      const createdEx = await this.http.post<ExerciseResponseWebVo>(`/api/workouts/${w.id}/exercises/${ex.id}/sets`, {}, { headers: this.headers() }).toPromise();
      if (createdEx) {
        // Find the newly added set (assume last)
        const newSet = createdEx.sets[createdEx.sets.length - 1];
        // Update with provided weight/reps if any non-zero
        if (newSet && (inputs.weight > 0 || inputs.reps > 0)) {
          await this.http.put(`/api/workouts/${w.id}/exercises/${ex.id}/sets/${newSet.setId}`, { setId: newSet.setId, weight: inputs.weight, reps: inputs.reps }, { headers: this.headers() }).toPromise();
          // Reload exercise after update
          const refreshedEx = await this.http.get<ExerciseResponseWebVo>(`/api/workouts/${w.id}/exercises/${ex.id}`, { headers: this.headers() }).toPromise().catch(() => null);
          if (refreshedEx) this.replaceExercise(refreshedEx); else this.replaceExercise(createdEx);
        } else {
          this.replaceExercise(createdEx);
        }
      }
      // Reset inputs for this exercise
      const clone = { ...this.pendingSetInputs() }; delete clone[ex.id]; this.pendingSetInputs.set(clone);
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to quick add set');
    } finally {
      this.loading.set(false);
    }
  }

  setPendingSetValue(exId: string, field: 'weight' | 'reps', value: number): void {
    const current = this.pendingSetInputs();
    const existing = current[exId] || { weight: 0, reps: 0 };
    const updated = { ...current, [exId]: { ...existing, [field]: value } };
    this.pendingSetInputs.set(updated);
  }

  async removeSet(ex: ExerciseResponseWebVo, set: SetResponseWebVo): Promise<void> {
    const w = this.workout();
    if (!w) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const updatedEx = await this.http.delete<ExerciseResponseWebVo>(`/api/workouts/${w.id}/exercises/${ex.id}/sets`, { headers: this.headers(), body: { setId: set.setId } }).toPromise();
      if (updatedEx) this.replaceExercise(updatedEx);
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to remove set');
    } finally {
      this.loading.set(false);
    }
  }

  async updateSet(ex: ExerciseResponseWebVo, set: SetResponseWebVo, field: 'weight' | 'reps', value: number): Promise<void> {
    const w = this.workout();
    if (!w) return;
    const original = { ...set };
    (set as any)[field] = value;
    try {
      await this.http.put(`/api/workouts/${w.id}/exercises/${ex.id}/sets/${set.setId}`, { setId: set.setId, weight: set.weight, reps: set.reps }, { headers: this.headers() }).toPromise();
    } catch (e: any) {
      Object.assign(set, original);
      this.error.set(e?.message || 'Failed to update set');
    }
  }

  async saveSet(ex: ExerciseResponseWebVo, set: SetResponseWebVo): Promise<void> {
    const w = this.workout();
    if (!w) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.http.put(`/api/workouts/${w.id}/exercises/${ex.id}/sets/${set.setId}`, { setId: set.setId, weight: set.weight, reps: set.reps }, { headers: this.headers() }).toPromise();
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to save set');
    } finally {
      this.loading.set(false);
    }
  }

  private replaceExercise(updated: ExerciseResponseWebVo): void {
    const w = this.workout();
    if (!w) return;
    this.workout.set({
      ...w,
      exercises: w.exercises.map(e => e.id === updated.id ? updated : e)
    });
    // If exercise now has sets, keep logging mode but allow continuing
    if (this.loggingMode() && w.exercises.every(ex => ex.sets.length > 0)) {
      // Logging mode persists unless user leaves
    }
  }
}
