const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface DataAvailability {
  has_nutrition_data: boolean;
  has_hydration_data: boolean;
  has_activity_data: boolean;
  has_weight_data: boolean;
  has_goal_data: boolean;
  has_meal_plan_data: boolean;
}

export interface CategorySummaryItem {
  logged_days: number;
  avg_value: number | null;
  target_value: number | null;
  unit: string;
  consistency_pct: number;
}

export interface HealthInsightsSummary {
  nutrition: CategorySummaryItem;
  hydration: CategorySummaryItem;
  activity: CategorySummaryItem;
  weight: {
    latest_weight_kg: number | null;
    earliest_weight_kg: number | null;
    change_kg: number | null;
  };
  goals: {
    active: number;
    completed: number;
    total: number;
  };
}

export interface TrendAnalysisPoint {
  date: string;
  calories: number | null;
  protein_g: number | null;
  water_ml: number | null;
  steps: number | null;
  active_minutes: number | null;
  weight_kg: number | null;
}

export interface TrendAnalysisSeries {
  metric: string;
  status: 'improving' | 'stable' | 'declining' | 'insufficient_data' | string;
  change_pct: number | null;
  message: string;
}

export interface CorrelationInsight {
  id: string;
  variables: string[];
  title: string;
  observation: string;
  strength: 'strong' | 'moderate' | 'weak' | 'insufficient_data' | string;
  overlapping_days: number;
  is_statistically_valid: boolean;
}

export interface RuleBasedInsight {
  id: string;
  category: 'nutrition' | 'hydration' | 'activity' | 'weight' | 'goals' | 'consistency' | 'meal_planning' | string;
  priority: 'low' | 'medium' | 'high' | string;
  title: string;
  message: string;
  evidence: string;
  action: string;
  data_available: boolean;
}

export interface PrioritizedAction {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | string;
  route: string;
}

export interface HealthInsightsResponse {
  period: string;
  persona: string;
  data_availability: DataAvailability;
  summary: HealthInsightsSummary;
  trend_points: TrendAnalysisPoint[];
  trends: TrendAnalysisSeries[];
  insights: RuleBasedInsight[];
  actions: PrioritizedAction[];
  correlations: CorrelationInsight[];
}

export const healthInsightsService = {
  /**
   * Fetches health insights payload for specified period ('7d', '14d', '30d', '90d').
   * GUARANTEE: Uses REAL DB telemetry. Zero fabricated metrics.
   */
  getHealthInsights: async (period: string = '7d'): Promise<HealthInsightsResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/health-insights?period=${encodeURIComponent(period)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        return (await res.json()) as HealthInsightsResponse;
      }
      return null;
    } catch (err: unknown) {
      console.warn('Error fetching health insights:', err);
      return null;
    }
  },
};

export default healthInsightsService;
