export interface CreateMealRequestWebVo {
  userId: string;
  name: string;
  calories: number;
  mealAtUtc: string;
  notes?: string;
}

export interface UpdateMealRequestWebVo {
  mealId: string;
  userId: string;
  name: string;
  calories: number;
  mealAtUtc: string;
  notes?: string;
}

export interface MealResponseWebVo {
  mealId: string;
  userId: string;
  name: string;
  calories: number;
  mealAtUtc: string;
  notes: string | null;
  createdAt: string;
}
