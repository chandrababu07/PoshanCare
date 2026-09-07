const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_fiber: number;
  pal_multiplier: number;
  goal_adjustment_calories: number;
  protein_g_per_kg: number;
  methodology: string;
}

export interface MacroItemSummary {
  target: number;
  consumed: number;
  remaining: number;
  adherence_pct: number;
}

export interface NutritionSummary {
  date: string;
  target_calories: number;
  consumed_calories: number;
  remaining_calories: number;
  caloric_adherence_pct: number;
  caloric_status_text: string;
  protein: MacroItemSummary;
  carbs: MacroItemSummary;
  fat: MacroItemSummary;
  fiber: MacroItemSummary;
}

export interface StatelessCalculateParams {
  age: number;
  biological_sex: 'male' | 'female' | 'unspecified';
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  primary_goal: string;
  progression_pace?: string;
  target_mass_kg?: number;
}

/**
 * Fetch authenticated user's personalized nutrition targets from backend API
 */
export async function fetchNutritionTargets(): Promise<NutritionTargets | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/nutrition/targets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as NutritionTargets;
  } catch (error) {
    console.warn('Backend Nutrition Targets API offline or unreachable:', error);
    return null;
  }
}

/**
 * Fetch actual vs target nutrition summary for date
 */
export async function fetchNutritionSummary(dateStr: string): Promise<NutritionSummary | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/nutrition/summary?date=${dateStr}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as NutritionSummary;
  } catch (error) {
    console.warn('Backend Nutrition Summary API offline or unreachable:', error);
    return null;
  }
}

/**
 * Perform custom calculation preview
 */
export async function calculateCustomTargets(
  params: StatelessCalculateParams
): Promise<NutritionTargets | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/nutrition/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as NutritionTargets;
  } catch (error) {
    console.warn('Backend Stateless Calculate API offline or unreachable:', error);
    return null;
  }
}
