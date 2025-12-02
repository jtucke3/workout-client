// Create meal request now uses email instead of userId
export interface CreateMealRequestWebVo {
  userEmail: string;
  name: string;
  calories: number;
  mealAtUtc: string;
  notes?: string;
}

export interface UpdateMealRequestWebVo {
  mealId: string;
  name: string;
  calories: number;
  mealAtUtc: string;
  notes?: string;
}

export interface MealResponseWebVo {
  id: string;
  userEmail: string;
  name: string;
  calories: number;
  mealAtUtc: string;
  notes: string;
  createdAt: string;
}
