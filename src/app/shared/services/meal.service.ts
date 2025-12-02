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

  getMeals(userId: string): Promise<MealResponseWebVo[]> {
    const headers = this.buildHeaders();
    return firstValueFrom(
      this.http.get<MealResponseWebVo[]>(`${this.MEALS_API_BASE}/${userId}`, { headers })
    );
  }

  createMeal(payload: CreateMealRequestWebVo): Promise<MealResponseWebVo> {
    const headers = this.buildHeaders();
    return firstValueFrom(
      this.http.post<MealResponseWebVo>(`${this.MEALS_API_BASE}/${payload.userId}`, payload, { headers })
    );
  }

  updateMeal(payload: UpdateMealRequestWebVo): Promise<MealResponseWebVo> {
    const headers = this.buildHeaders();
    return firstValueFrom(
      this.http.put<MealResponseWebVo>(
        `${this.MEALS_API_BASE}/${payload.userId}/${payload.mealId}`, payload, { headers })
    );
  }

  deleteMeal(userId: string, mealId: string): Promise<void> {
    const headers = this.buildHeaders();
    const url = `${this.MEALS_API_BASE}/${userId}/${mealId}`;
    console.debug('[MealService] DELETE', url);
    return firstValueFrom(
      this.http.delete<void>(url, { headers })
    );
  }
}
