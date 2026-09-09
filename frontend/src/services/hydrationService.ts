const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface CreateWaterLogParams {
  date: string;
  amount_ml: number;
  note?: string;
}

export interface WaterLogItem {
  id: string;
  raw_id: number;
  user_id: number;
  date: string;
  amount_ml: number;
  note?: string;
  created_at: string;
}

export interface HydrationDailySummary {
  date: string;
  total_water_ml: number;
  target_water_ml: number;
  has_data: boolean;
  logs: WaterLogItem[];
}

/**
 * Fetch daily hydration summary and logs for date from backend API.
 */
export async function fetchDailyHydration(dateStr?: string): Promise<HydrationDailySummary | null> {
  try {
    const url = dateStr
      ? `${API_BASE_URL}/hydration?date=${dateStr}`
      : `${API_BASE_URL}/hydration`;

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

    return (await response.json()) as HydrationDailySummary;
  } catch (error) {
    console.warn('Backend Hydration API offline or unreachable:', error);
    return null;
  }
}

/**
 * Add water log increment to backend API.
 */
export async function addWaterLog(params: CreateWaterLogParams): Promise<WaterLogItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/hydration`, {
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

    return (await response.json()) as WaterLogItem;
  } catch (error) {
    console.warn('Backend Add Water API unreachable:', error);
    return null;
  }
}

/**
 * Delete a user-owned water log increment.
 */
export async function deleteWaterLog(logId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/hydration/${logId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.warn('Backend Delete Water API unreachable:', error);
    return false;
  }
}
