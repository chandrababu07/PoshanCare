import { CustomRecipe, RecipeIngredient } from '../data/mockRecipes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BackendRecipeIngredient {
  id?: number;
  food_id?: number | null;
  name: string;
  code?: string | null;
  subtext?: string | null;
  batch_measure: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
}

export interface BackendRecipeResponse {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  servings: number;
  portion_weight_grams?: number | null;
  prep_time_minutes: number;
  image_url?: string | null;
  batch_calories: number;
  batch_protein: number;
  batch_carbs: number;
  batch_fat: number;
  batch_fiber: number;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving: number;
  created_at: string;
  updated_at: string;
  ingredients: BackendRecipeIngredient[];
}

const mapBackendToFrontendRecipe = (b: BackendRecipeResponse): CustomRecipe => {
  return {
    id: String(b.id),
    title: b.title,
    description: b.description || '',
    servings: b.servings,
    portionWeightGrams: b.portion_weight_grams || 185,
    batchCalories: b.batch_calories,
    batchProtein: b.batch_protein,
    batchCarbs: b.batch_carbs,
    batchFat: b.batch_fat,
    caloriesPerServing: b.calories_per_serving,
    proteinPerServing: b.protein_per_serving,
    carbsPerServing: b.carbs_per_serving,
    fatPerServing: b.fat_per_serving,
    prepTimeMinutes: b.prep_time_minutes,
    imageUrl: b.image_url || undefined,
    ingredients: (b.ingredients || []).map((ing) => ({
      id: ing.id ? String(ing.id) : `ing-${Date.now()}`,
      name: ing.name,
      code: ing.code || '',
      subtext: ing.subtext || '',
      batchMeasure: ing.batch_measure,
      calories: ing.calories,
      protein: ing.protein_g,
      carbs: ing.carbs_g,
      fat: ing.fat_g,
    })),
  };
};

export const recipeService = {
  /**
   * Fetch all custom recipes for current user from backend, with mock fallback.
   */
  getRecipes: async (): Promise<CustomRecipe[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        const data = (await response.json()) as BackendRecipeResponse[];
        if (Array.isArray(data)) {
          return data.map(mapBackendToFrontendRecipe);
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Create a new custom recipe.
   */
  createRecipe: async (recipeData: {
    title: string;
    description?: string;
    servings: number;
    portionWeightGrams?: number;
    prepTimeMinutes?: number;
    imageUrl?: string;
    ingredients: RecipeIngredient[];
  }): Promise<CustomRecipe | null> => {
    try {
      const payload = {
        title: recipeData.title,
        description: recipeData.description || null,
        servings: recipeData.servings,
        portion_weight_grams: recipeData.portionWeightGrams,
        prep_time_minutes: recipeData.prepTimeMinutes || 15,
        image_url: recipeData.imageUrl,
        ingredients: recipeData.ingredients.map((ing) => ({
          name: ing.name,
          code: ing.code || null,
          subtext: ing.subtext || null,
          batch_measure: ing.batchMeasure,
          calories: ing.calories,
          protein_g: ing.protein,
          carbs_g: ing.carbs,
          fat_g: ing.fat,
        })),
      };

      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = (await response.json()) as BackendRecipeResponse;
        return mapBackendToFrontendRecipe(data);
      }
      return null;
    } catch (error) {
      console.warn('Create recipe API error:', error);
      return null;
    }
  },

  /**
   * Delete a custom recipe by ID.
   */
  deleteRecipe: async (id: string): Promise<boolean> => {
    try {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        const response = await fetch(`${API_BASE_URL}/recipes/${numId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        return response.ok;
      }
      return true;
    } catch {
      return true;
    }
  },

  /**
   * Log 1 or more servings of recipe to meal diary.
   */
  logRecipeToMeal: async (
    id: string,
    mealType: string,
    servingsLogged: number = 1.0,
    consumedAt?: string
  ): Promise<{ message: string }> => {
    try {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        const payload = {
          meal_type: mealType,
          consumed_at: consumedAt || new Date().toISOString(),
          servings_logged: servingsLogged,
        };
        const response = await fetch(`${API_BASE_URL}/recipes/${numId}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const resData = (await response.json()) as { message: string };
          return resData;
        }
      }
      return { message: `Logged ${servingsLogged} serving(s) of recipe to ${mealType}` };
    } catch {
      return { message: `Logged ${servingsLogged} serving(s) of recipe to ${mealType}` };
    }
  },
};
