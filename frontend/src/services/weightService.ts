import { WeightLogEntry } from '../data/mockWeight';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BackendWeightLog {
  id: string;
  raw_id: number;
  user_id: number;
  date: string;
  weight_kg: number;
  moving_average: number;
  note?: string | null;
  created_at: string;
}

export interface BackendWeightSummary {
  current_weight: number;
  target_weight: number;
  start_weight: number;
  net_change: number;
  weekly_velocity: number;
  progress_pct: number;
  days_tracked: number;
  logs: BackendWeightLog[];
}

export interface CreateWeightLogPayload {
  date: string; // YYYY-MM-DD
  weight_kg: number;
  note?: string;
}

/**
 * Fetch weight log trajectory summary and history from backend
 */
export async function fetchWeightSummaryFromApi(): Promise<BackendWeightSummary | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/weight`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BackendWeightSummary;
  } catch (error) {
    console.warn('Backend Weight API offline or unreachable:', error);
    return null;
  }
}

/**
 * Log or update a daily weight measurement
 */
export async function addWeightLogToApi(
  payload: CreateWeightLogPayload
): Promise<BackendWeightLog | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/weight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as BackendWeightLog;
  } catch (error) {
    console.warn('Add weight log API error:', error);
    return null;
  }
}

/**
 * Delete a weight log entry
 */
export async function deleteWeightLogFromApi(rawId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/weight/${rawId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.warn('Delete weight log API error:', error);
    return false;
  }
}

/**
 * Map backend WeightLog to frontend legacy WeightLogEntry format
 */
export function mapBackendWeightLogToFrontend(log: BackendWeightLog): WeightLogEntry {
  return {
    id: log.id,
    date: log.date,
    weight: log.weight_kg,
    movingAverage: log.moving_average,
    note: log.note || undefined,
  };
}
