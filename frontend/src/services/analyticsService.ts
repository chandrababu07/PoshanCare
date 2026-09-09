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
      if (import.meta.env.DEV) {
        return getFallbackAnalytics(period);
      }
      return null;
    } catch {
      if (import.meta.env.DEV) {
        return getFallbackAnalytics(period);
      }
      return null;
    }
  },
};

/**
 * Fallback analytics structure matching backend schemas for offline / demo mode.
 */
function getFallbackAnalytics(period: string): DashboardAnalyticsResponse {
  const daysMap: Record<string, number> = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
    '6m': 180,
    '1y': 365,
  };
  const days = daysMap[period] || 30;

  return {
    period: period,
    days_in_period: days,
    overview: {
      current_weight: 56.4,
      weight_change_kg: 0.3,
      avg_daily_calories: 2638,
      protein_adherence_pct: 75.0,
      consistency_score: 82,
    },
    weight: {
      start_weight: 56.1,
      current_weight: 56.4,
      total_change_kg: 0.3,
      avg_weight: 56.2,
      min_weight: 56.0,
      max_weight: 56.6,
      weight_change_pct: 0.5,
      weekly_velocity: 0.3,
      moving_average_7d: 56.3,
      trend_direction: 'increasing',
    },
    calories: {
      target_calories: 2600,
      avg_daily_calories: 2638,
      total_calories_consumed: 2638 * days,
      avg_calorie_diff: 38,
      days_meeting_target: Math.round(days * 0.8),
      days_below_target: Math.round(days * 0.1),
      days_above_target: Math.round(days * 0.1),
      adherence_pct: 80.0,
    },
    macros: {
      protein: {
        target: 140,
        avg_intake: 105,
        pct_of_target: 75.0,
        adherence_pct: 75.0,
        trend: 'stable',
      },
      carbs: {
        target: 325,
        avg_intake: 327,
        pct_of_target: 100.6,
        adherence_pct: 100.0,
        trend: 'increasing',
      },
      fat: {
        target: 75,
        avg_intake: 84,
        pct_of_target: 112.0,
        adherence_pct: 100.0,
        trend: 'stable',
      },
      fiber: {
        target: 30,
        avg_intake: 38,
        pct_of_target: 126.7,
        adherence_pct: 100.0,
        trend: 'stable',
      },
    },
    consistency: {
      score: 82,
      logging_consistency: 90.0,
      calorie_adherence: 80.0,
      protein_adherence: 75.0,
      fiber_adherence: 100.0,
    },
    goals: {
      start_weight: 56.1,
      current_weight: 56.4,
      target_weight: 68.0,
      progress_pct: 2.5,
      remaining_change_kg: 11.6,
      direction_to_target: 'weight-gain',
    },
    comparisons: {
      weight: { current_value: 56.4, previous_value: 56.1, absolute_change: 0.3, percent_change: 0.5, direction: 'increased' },
      calories: { current_value: 2638, previous_value: 2590, absolute_change: 48, percent_change: 1.9, direction: 'increased' },
      protein: { current_value: 105, previous_value: 102, absolute_change: 3, percent_change: 2.9, direction: 'increased' },
      logging_consistency: { current_value: 90.0, previous_value: 85.0, absolute_change: 5.0, percent_change: 5.9, direction: 'increased' },
    },
    insights: [
      {
        category: 'nutrition',
        priority: 'success',
        title: 'Caloric Adherence Target Met',
        description: 'Average daily caloric intake (2,638 kcal) remains within prescribed 90-110% target window.',
        metric: { value: 101.4, unit: '%' },
      },
      {
        category: 'nutrition',
        priority: 'info',
        title: 'Sub-optimal Protein Velocity',
        description: 'Average daily protein (105g) is below target (140g). Consider adding curd or whey.',
        metric: { value: 105, unit: 'g/day' },
      },
      {
        category: 'weight',
        priority: 'info',
        title: 'Mass Accretion Velocity',
        description: 'Recorded body mass shows controlled upward trajectory (+0.3 kg/wk).',
        metric: { value: 0.3, unit: 'kg/wk' },
      },
      {
        category: 'consistency',
        priority: 'success',
        title: 'High Telemetry Consistency',
        description: `Food diary logged consistently across the ${days}-day analysis window.`,
        metric: { value: 90.0, unit: '%' },
      },
    ],
  };
}
