import { NutritionIntelligenceResponse } from './nutritionIntelligenceService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface TodayHealthSummary {
  date: string;
  calories: number;
  target_calories: number;
  protein_g: number;
  target_protein_g: number;
  carbs_g: number;
  target_carbs_g: number;
  fat_g: number;
  target_fat_g: number;
  water_ml: number;
  target_water_ml: number;
  hydration_pct: number;
  remaining_water_ml: number;
  steps?: number | null;
  active_minutes?: number | null;
  exercise_minutes?: number | null;
  activity_level?: string | null;
  current_weight_kg?: number | null;
}

export interface DayTrendPoint {
  date: string;
  has_meal_log: boolean;
  calories?: number | null;
  protein_g?: number | null;
  has_water_log: boolean;
  water_ml?: number | null;
  has_activity_log: boolean;
  steps?: number | null;
  active_minutes?: number | null;
  has_weight_log: boolean;
  weight_kg?: number | null;
}

export interface WeeklyTrendAnalytics {
  days: DayTrendPoint[];
  avg_daily_calories?: number | null;
  avg_daily_water_ml?: number | null;
  avg_daily_steps?: number | null;
  avg_daily_active_mins?: number | null;
}

export interface DataAvailability {
  has_nutrition_today: boolean;
  has_hydration_today: boolean;
  has_activity_today: boolean;
  has_weight_data: boolean;
  has_weekly_data: boolean;
}

export interface PersonaAdaptation {
  profile_type: string;
  headline: string;
  subtext: string;
  focus_areas: string[];
}

export interface HealthOverviewResponse {
  period: string;
  days_in_period: number;
  data_availability: DataAvailability;
  today: TodayHealthSummary;
  weekly_trends: WeeklyTrendAnalytics;
  intelligence: NutritionIntelligenceResponse;
  persona: PersonaAdaptation;
}

export const fetchHealthOverview = async (
  period: string = '7d'
): Promise<HealthOverviewResponse | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/health-overview?period=${period}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (response.ok) {
      return (await response.json()) as HealthOverviewResponse;
    }
    return null;
  } catch (error) {
    console.warn('Health overview fetch error:', error);
    return null;
  }
};
