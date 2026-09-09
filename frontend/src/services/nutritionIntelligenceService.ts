const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface NutritionSummaryItem {
  actual: number;
  target: number;
  status: 'within_range' | 'below_target' | 'above_target' | string;
}

export interface MacroSummaryItem {
  actual_g: number;
  target_g: number;
  status: 'within_range' | 'below_target' | 'above_target' | string;
}

export interface IntelligenceSummary {
  calories: NutritionSummaryItem;
  protein: MacroSummaryItem;
  carbs_g: number;
  target_carbs_g: number;
  fat_g: number;
  target_fat_g: number;
  fiber_g: number;
  target_fiber_g: number;
}

export interface IntelligenceInsight {
  type: string;
  severity: 'info' | 'success' | 'warning' | string;
  title: string;
  message: string;
  reason: string;
}

export interface FoodRecommendationItem {
  food_id: number;
  food_name: string;
  category: string;
  region: string;
  is_vegetarian: boolean;
  reason: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface IntelligenceRecommendation {
  category: string;
  title: string;
  message: string;
  foods: FoodRecommendationItem[];
}

export interface IntelligenceDataQuality {
  logged_meals: number;
  logged_days: number;
  has_weight_data: boolean;
  has_profile: boolean;
}

export interface NutritionIntelligenceResponse {
  has_sufficient_data: boolean;
  insufficient_data_reason?: string;
  summary?: IntelligenceSummary;
  insights: IntelligenceInsight[];
  recommendations: IntelligenceRecommendation[];
  data_quality: IntelligenceDataQuality;
}

/**
 * Fetch authenticated user's personalized nutrition intelligence analysis from backend API.
 * NO mock data or fabricated numbers are returned.
 */
export async function fetchNutritionIntelligence(
  dateStr?: string
): Promise<NutritionIntelligenceResponse | null> {
  try {
    const url = dateStr
      ? `${API_BASE_URL}/nutrition/intelligence?date=${dateStr}`
      : `${API_BASE_URL}/nutrition/intelligence`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as NutritionIntelligenceResponse;
  } catch (error) {
    console.warn('Backend Nutrition Intelligence API offline or unreachable:', error);
    return null;
  }
}
