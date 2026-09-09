const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface OverviewMetrics {
  current_weight: number;
  weight_change_kg: number;
  avg_daily_calories: number;
  protein_adherence_pct: number;
  consistency_score: number;
}

export interface WeightAnalytics {
  start_weight: number;
  current_weight: number;
  total_change_kg: number;
  avg_weight: number;
  min_weight: number;
  max_weight: number;
  weight_change_pct: number;
  weekly_velocity: number;
  moving_average_7d: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
}

export interface CalorieAnalytics {
  target_calories: number;
  avg_daily_calories: number;
  total_calories_consumed: number;
  avg_calorie_diff: number;
  days_meeting_target: number;
  days_below_target: number;
  days_above_target: number;
  adherence_pct: number;
}

export interface MacroItemAnalytics {
  target: number;
  avg_intake: number;
  pct_of_target: number;
  adherence_pct: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MacronutrientAnalytics {
  protein: MacroItemAnalytics;
  carbs: MacroItemAnalytics;
  fat: MacroItemAnalytics;
  fiber: MacroItemAnalytics;
}

export interface ConsistencyScoreComponents {
  score: number;
  logging_consistency: number;
  calorie_adherence: number;
  protein_adherence: number;
  fiber_adherence: number;
}

export interface GoalProgressAnalytics {
  start_weight: number;
  current_weight: number;
  target_weight?: number | null;
  progress_pct: number;
  remaining_change_kg: number;
  direction_to_target: 'weight-loss' | 'weight-gain' | 'maintain';
}

export interface ClinicalInsightItem {
  category: 'nutrition' | 'weight' | 'consistency';
  priority: 'info' | 'success' | 'warning';
  title: string;
  description: string;
  metric?: {
    value: number;
    unit: string;
  };
}

export interface ComparisonItem {
  current_value: number;
  previous_value: number;
  absolute_change: number;
  percent_change?: number | null;
  direction: 'increased' | 'decreased' | 'stable';
}

export interface DashboardAnalyticsResponse {
  period: string;
  days_in_period: number;
  has_weight_data?: boolean;
  has_diary_data?: boolean;
  logged_days_count?: number;
  overview: OverviewMetrics;
  weight: WeightAnalytics;
  calories: CalorieAnalytics;
  macros: MacronutrientAnalytics;
  consistency: ConsistencyScoreComponents;
  goals?: GoalProgressAnalytics | null;
  comparisons: Record<string, ComparisonItem>;
  insights: ClinicalInsightItem[];
}

export const analyticsService = {
  /**
   * Fetch longitudinal dashboard analytics for specified time period.
   * Returns null on network or API failure (no fake hardcoded stats).
   */
  getDashboardAnalytics: async (
    period: string = '30d'
  ): Promise<DashboardAnalyticsResponse | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard?period=${period}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        return (await response.json()) as DashboardAnalyticsResponse;
      }
      return null;
    } catch {
      return null;
    }
  },
};
