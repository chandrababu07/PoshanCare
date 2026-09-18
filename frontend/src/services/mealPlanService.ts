const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface MealRecommendationItem {
  food_id: number;
  food_name: string;
  category: string;
  is_vegetarian: boolean;
  serving_size_g: number;
  serving_size_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence_score: number;
  reasons: string[];
  suitable_meal_types: string[];
}

export interface DataQualityInfo {
  has_profile_data: boolean;
  has_diary_logs: boolean;
  note: string;
}

export interface RecommendationsResponse {
  recommendations: MealRecommendationItem[];
  data_quality: DataQualityInfo;
}

export interface MealPlanItemResponse {
  id: number;
  meal_plan_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
  food_id: number;
  food_name: string;
  servings: number;
  serving_size_g: number;
  serving_size_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealGroup {
  meal_type: string;
  items: MealPlanItemResponse[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface NutritionSummary {
  total_calories: number;
  target_calories: number;
  total_protein_g: number;
  target_protein_g: number;
  total_carbs_g: number;
  target_carbs_g: number;
  total_fat_g: number;
  target_fat_g: number;
}

export interface MealPlanResponse {
  id: number;
  user_id: number;
  plan_date: string;
  notes?: string | null;
  meals: MealGroup[];
  nutrition_summary: NutritionSummary;
  created_at: string;
  updated_at: string;
}

export interface GenerateMealPlanRequest {
  plan_date?: string;
  meal_types?: string[];
  notes?: string;
}

export interface AddMealPlanItemRequest {
  meal_type: string;
  food_id: number;
  servings?: number;
}

export const mealPlanService = {
  /**
   * Get today's meal plan or for a specific date.
   */
  getTodayMealPlan: async (date?: string): Promise<MealPlanResponse | null> => {
    try {
      const url = date
        ? `${API_BASE_URL}/meal-plans/today?date=${date}`
        : `${API_BASE_URL}/meal-plans/today`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as MealPlanResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Get smart personalized meal recommendations based on real profile & intake data.
   */
  getRecommendations: async (): Promise<RecommendationsResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/meal-plans/recommendations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as RecommendationsResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Automatically generate a smart meal plan for a specific date.
   */
  generateMealPlan: async (data: GenerateMealPlanRequest): Promise<MealPlanResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/meal-plans/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return (await res.json()) as MealPlanResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Get history of all user meal plans.
   */
  getMealPlans: async (): Promise<MealPlanResponse[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/meal-plans`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as MealPlanResponse[];
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Add a single item to a meal plan.
   */
  addMealPlanItem: async (
    planId: number,
    item: AddMealPlanItemRequest
  ): Promise<MealPlanResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/meal-plans/${planId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
      });
      if (res.ok) {
        return (await res.json()) as MealPlanResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Delete an item from a meal plan.
   */
  removeMealPlanItem: async (
    planId: number,
    itemId: number
  ): Promise<MealPlanResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/meal-plans/${planId}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as MealPlanResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Delete an entire meal plan.
   */
  deleteMealPlan: async (planId: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/meal-plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Log an entire meal group from a meal plan directly to the food diary.
   */
  logMealPlanGroupToDiary: async (
    planId: number,
    mealType: string,
    date?: string
  ): Promise<{ message: string; logged_count: number } | null> => {
    try {
      const url = date
        ? `${API_BASE_URL}/meal-plans/${planId}/log-to-diary?meal_type=${mealType}&date=${date}`
        : `${API_BASE_URL}/meal-plans/${planId}/log-to-diary?meal_type=${mealType}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },
};
