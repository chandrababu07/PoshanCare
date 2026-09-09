const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface UpsertActivityParams {
  date: string;
  activity_level?: string;
  steps?: number;
  active_minutes?: number;
  exercise_minutes?: number;
  activity_type?: string;
  notes?: string;
}

export interface ActivityLogItem {
  id: string;
  raw_id: number;
  user_id: number;
  date: string;
  activity_level?: string;
  steps?: number;
  active_minutes?: number;
  exercise_minutes?: number;
  activity_type?: string;
  notes?: string;
  created_at: string;
}

export interface ActivityDailySummary {
  date: string;
  has_activity_data: boolean;
  log: ActivityLogItem | null;
}

export interface ActivityHistorySummary {
  period: string;
  days_in_period: number;
  logged_days_count: number;
  avg_steps: number | null;
  total_steps: number;
  logs: ActivityLogItem[];
}

/**
 * Fetch daily activity telemetry for date from backend API.
 */
export async function fetchDailyActivity(dateStr?: string): Promise<ActivityDailySummary | null> {
  try {
    const url = dateStr
      ? `${API_BASE_URL}/activity?date=${dateStr}`
      : `${API_BASE_URL}/activity`;

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

    return (await response.json()) as ActivityDailySummary;
  } catch (error) {
    console.warn('Backend Activity API offline or unreachable:', error);
    return null;
  }
}

/**
 * Create or update daily activity log record.
 */
export async function upsertActivityLog(params: UpsertActivityParams): Promise<ActivityLogItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ActivityLogItem;
  } catch (error) {
    console.warn('Backend Activity Upsert API unreachable:', error);
    return null;
  }
}

/**
 * Fetch activity history timeline over period.
 */
export async function fetchActivityHistory(periodStr: string = '30d'): Promise<ActivityHistorySummary | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity/history?period=${periodStr}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ActivityHistorySummary;
  } catch (error) {
    console.warn('Backend Activity History API unreachable:', error);
    return null;
  }
}
