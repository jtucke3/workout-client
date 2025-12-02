import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthUserService } from './auth-user.service';
import {
  MealResponseWebVo,
  CreateMealRequestWebVo,
  UpdateMealRequestWebVo
} from '../models/meal-api.models';

@Injectable({ providedIn: 'root' })
export class MealService {
  private http = inject(HttpClient);
  private authUser = inject(AuthUserService);

  private readonly MEALS_API_BASE = '/api/meals';

  private buildHeaders(): HttpHeaders {
    const token =
      (typeof window !== 'undefined' && (localStorage.getItem('token') || sessionStorage.getItem('token')))
      || null;

    const headersInit: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (token) headersInit['Authorization'] = `Bearer ${token}`;

    return new HttpHeaders(headersInit);
  }

  getMeals(userEmail: string): Promise<MealResponseWebVo[]> {
    const headers = this.buildHeaders();
    const encodedEmail = encodeURIComponent(userEmail);
    return firstValueFrom(
      this.http.get<MealResponseWebVo[]>(`${this.MEALS_API_BASE}/user/${encodedEmail}`, { headers })
    );
  }

  createMeal(payload: CreateMealRequestWebVo): Promise<MealResponseWebVo> {
    const headers = this.buildHeaders();
    return firstValueFrom(
      this.http.post<MealResponseWebVo>(`${this.MEALS_API_BASE}/create`, payload, { headers })
    );
  }

  updateMeal(payload: UpdateMealRequestWebVo): Promise<MealResponseWebVo> {
    const headers = this.buildHeaders();
    return firstValueFrom(
      this.http.put<MealResponseWebVo>(
        `${this.MEALS_API_BASE}/${payload.mealId}`, payload, { headers })
    );
  }

  deleteMeal(mealId: string): Promise<void> {
    const headers = this.buildHeaders();
    return firstValueFrom(
      this.http.delete<void>(`${this.MEALS_API_BASE}/${mealId}`, { headers })
    );
  }
}
