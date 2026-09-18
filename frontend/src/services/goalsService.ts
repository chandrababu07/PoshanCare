import { parseApiError } from '../utils/apiErrors';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface GoalResponse {
  id: number;
  user_id: number;
  goal_type: 'nutrition' | 'hydration' | 'activity' | 'weight_tracking' | 'meal_consistency' | 'protein' | 'custom' | string;
  title: string;
  description?: string | null;
  target_value: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'ongoing' | string;
  start_date: string;
  target_date?: string | null;
  status: 'active' | 'completed' | 'paused' | 'archived' | string;
  created_at: string;
  updated_at: string;
}

export interface GoalProgressResponse {
  goal: GoalResponse;
  current_value?: number | null;
  target_value: number;
  progress_percentage?: number | null;
  unit: string;
  has_data: boolean;
  data_quality: 'sufficient_data' | 'partial_data' | 'insufficient_data' | 'no_data' | string;
  message: string;
  period_start: string;
  period_end: string;
}

export interface CoachingInsightResponse {
  id: string;
  category: 'nutrition' | 'hydration' | 'activity' | 'weight' | 'consistency' | 'general' | string;
  priority: 'high' | 'medium' | 'low' | string;
  title: string;
  message: string;
  suggested_action?: string | null;
  suggested_route?: string | null;
  metric_context?: Record<string, unknown> | null;
}

export interface GoalDashboardResponse {
  active_goals: GoalProgressResponse[];
  completed_goals_count: number;
  total_goals_count: number;
  coaching_insights: CoachingInsightResponse[];
  data_quality_summary: string;
  persona: string;
}

export interface GoalCreateRequest {
  goal_type: string;
  title: string;
  description?: string;
  target_value: number;
  unit: string;
  frequency?: string;
  start_date?: string;
  target_date?: string;
}

export interface GoalUpdateRequest {
  title?: string;
  description?: string;
  target_value?: number;
  unit?: string;
  frequency?: string;
  target_date?: string;
  status?: string;
}

export const goalsService = {
  /**
   * Get all health goals for current user (optional status filter).
   */
  getGoals: async (statusFilter?: string): Promise<GoalResponse[]> => {
    try {
      const url = statusFilter
        ? `${API_BASE_URL}/goals?status=${statusFilter}`
        : `${API_BASE_URL}/goals`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as GoalResponse[];
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch aggregated goals dashboard with active progress and adaptive coaching insights.
   */
  getGoalsDashboard: async (): Promise<GoalDashboardResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/goals/dashboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as GoalDashboardResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch explainable adaptive coaching insights.
   */
  getCoachingInsights: async (): Promise<CoachingInsightResponse[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/goals/coaching/insights`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as CoachingInsightResponse[];
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Create a new health goal with backend persona safety validation.
   */
  createGoal: async (data: GoalCreateRequest): Promise<{ goal?: GoalResponse; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        return { goal: body as GoalResponse };
      }
      const rawMsg = body?.error?.message || body?.detail || 'Failed to create goal';
      const parsed = parseApiError(new Error(rawMsg), res.status);
      return { error: parsed.message };
    } catch (e: unknown) {
      const parsed = parseApiError(e);
      return { error: parsed.message };
    }
  },

  /**
   * Get single goal progress details.
   */
  getGoalProgress: async (goalId: number): Promise<GoalProgressResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${goalId}/progress`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as GoalProgressResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Update goal fields or status.
   */
  updateGoal: async (
    goalId: number,
    data: GoalUpdateRequest
  ): Promise<{ goal?: GoalResponse; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (res.ok) {
        return { goal: body as GoalResponse };
      }
      const errMsg = body?.error?.message || body?.detail || 'Failed to update goal';
      return { error: errMsg };
    } catch (e: unknown) {
      const err = e as Error;
      return { error: err?.message || 'Network error updating goal' };
    }
  },

  /**
   * Complete a goal.
   */
  completeGoal: async (goalId: number): Promise<GoalResponse | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${goalId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (res.ok) {
        return (await res.json()) as GoalResponse;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Archive a goal.
   */
  deleteGoal: async (goalId: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
