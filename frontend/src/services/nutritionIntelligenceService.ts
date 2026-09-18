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

// === PHASE 2.13 EXTENDED MODELS ===

export interface DataAvailabilitySummary {
  period: string;
  sufficiency_level: 'insufficient_data' | 'limited_data' | 'moderate_data' | 'strong_pattern' | string;
  logged_days: number;
  total_meals_logged: number;
  unique_foods_logged: number;
  has_water_logs: boolean;
  has_activity_logs: boolean;
  active_goals_count: number;
  explanation: string;
}

export interface NutrientGapItem {
  nutrient: string;
  observed_daily_avg: number;
  target_value: number;
  unit: string;
  status: 'below_target' | 'within_range' | 'above_target' | 'insufficient_data' | string;
  percentage_of_target?: number;
  confidence: 'limited_data' | 'moderate_data' | 'strong_pattern' | string;
  explanation: string;
  suggested_foods: string[];
}

export interface NutritionPatternItem {
  id: string;
  title: string;
  observation: string;
  evidence: string;
  priority: 'high' | 'medium' | 'low' | string;
  category: 'nutrient_balance' | 'variety' | 'hydration' | 'timing' | 'growth' | string;
}

export interface SmartSubstitutionItem {
  current_food_name: string;
  suggested_food_name: string;
  food_id: number;
  category: string;
  measurable_reason: string;
  calories: number;
  protein_g: number;
  fiber_g: number;
}

export interface MealVarietyAnalysis {
  unique_foods_count: number;
  food_groups_represented: string[];
  diversity_score: 'insufficient_data' | 'needs_variety' | 'moderate_variety' | 'diverse_intake' | string;
  observation: string;
}

export interface MealTimingAnalysis {
  has_timing_data: boolean;
  avg_breakfast_time?: string;
  avg_lunch_time?: string;
  avg_dinner_time?: string;
  eating_window_hours?: number;
  observation: string;
}

export interface HydrationActivityContext {
  has_combined_data: boolean;
  active_days_count: number;
  avg_water_on_active_days_ml?: number;
  avg_water_on_rest_days_ml?: number;
  observation: string;
}

export interface GoalAlignmentItem {
  goal_id: number;
  goal_type: string;
  title: string;
  target_summary: string;
  current_status: string;
  supportive_action: string;
}

export interface NutritionActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low' | string;
  category: string;
  route?: string;
}

export interface NutritionIntelligenceResponse {
  // Existing Baseline Fields
  has_sufficient_data: boolean;
  insufficient_data_reason?: string;
  summary?: IntelligenceSummary;
  insights: IntelligenceInsight[];
  recommendations: IntelligenceRecommendation[];
  data_quality: IntelligenceDataQuality;

  // Phase 2.13 Advanced Intelligence Extensions
  period: string;
  data_availability?: DataAvailabilitySummary;
  nutrient_gaps: NutrientGapItem[];
  patterns: NutritionPatternItem[];
  substitutions: SmartSubstitutionItem[];
  variety_analysis?: MealVarietyAnalysis;
  meal_timing?: MealTimingAnalysis;
  hydration_activity_context?: HydrationActivityContext;
  goal_alignment: GoalAlignmentItem[];
  daily_actions: NutritionActionItem[];
}

/**
 * Fetch authenticated user's personalized nutrition intelligence analysis from backend API.
 * NO mock data or fabricated numbers are returned.
 */
export async function fetchNutritionIntelligence(
  dateStr?: string,
  periodStr?: string
): Promise<NutritionIntelligenceResponse | null> {
  try {
    const params = new URLSearchParams();
    if (dateStr) params.append('date', dateStr);
    if (periodStr) params.append('period', periodStr);

    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/nutrition/intelligence?${queryString}`
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
