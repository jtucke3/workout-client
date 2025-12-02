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
  loading = signal(false);
  error = signal<string | null>(null);

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
    const uid = this.userId();
    if (token) init['Authorization'] = `Bearer ${token}`;
    if (uid) init['X-User-Id'] = uid; // add explicit user id header if backend expects it
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
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to create workout');
    } finally {
      this.loading.set(false);
    }
  }

  async addExercise(): Promise<void> {
    const w = this.workout();
    if (!w) return;
    const uid = this.userId();
    if (!this.exName().trim()) {
      this.error.set('Exercise name required');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const body = {
      // backend WebVo shows workoutId field; include it to satisfy request mapping
      workoutId: w.id,
      name: this.exName().trim(),
      notes: this.exNotes().trim() || null,
      equipment: this.exEquipment().trim() || null,
      bodyPart: this.exBodyPart().trim() || null
    };
    try {
      // include userId as query param if available (some endpoints may require it for authorization)
      const url = uid ? `/api/workouts/${w.id}/exercises?userId=${encodeURIComponent(uid)}` : `/api/workouts/${w.id}/exercises`;
      const updated = await this.http.post<WorkoutResponseWebVo>(url, body, { headers: this.headers() }).toPromise();
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
    const uid = this.userId();
    this.loading.set(true);
    this.error.set(null);
    try {
      const url = uid ? `/api/workouts/${w.id}/exercises/${ex.id}/sets?userId=${encodeURIComponent(uid)}` : `/api/workouts/${w.id}/exercises/${ex.id}/sets`;
      const updatedEx = await this.http.post<ExerciseResponseWebVo>(url, {}, { headers: this.headers() }).toPromise();
      if (updatedEx) this.replaceExercise(updatedEx);
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to add set');
    } finally {
      this.loading.set(false);
    }
  }

  async removeSet(ex: ExerciseResponseWebVo, set: SetResponseWebVo): Promise<void> {
    const w = this.workout();
    if (!w) return;
    const uid = this.userId();
    this.loading.set(true);
    this.error.set(null);
    try {
      const url = uid ? `/api/workouts/${w.id}/exercises/${ex.id}/sets?userId=${encodeURIComponent(uid)}` : `/api/workouts/${w.id}/exercises/${ex.id}/sets`;
      const updatedEx = await this.http.delete<ExerciseResponseWebVo>(url, { headers: this.headers(), body: { setId: set.setId } }).toPromise();
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
    const uid = this.userId();
    const original = { ...set };
    (set as any)[field] = value;
    try {
      const url = uid ? `/api/workouts/${w.id}/exercises/${ex.id}/sets/${set.setId}?userId=${encodeURIComponent(uid)}` : `/api/workouts/${w.id}/exercises/${ex.id}/sets/${set.setId}`;
      await this.http.put(url, { setId: set.setId, weight: set.weight, reps: set.reps }, { headers: this.headers() }).toPromise();
    } catch (e: any) {
      Object.assign(set, original);
      this.error.set(e?.message || 'Failed to update set');
    }
  }

  private replaceExercise(updated: ExerciseResponseWebVo): void {
    const w = this.workout();
    if (!w) return;
    this.workout.set({
      ...w,
      exercises: w.exercises.map(e => e.id === updated.id ? updated : e)
    });
  }
}
