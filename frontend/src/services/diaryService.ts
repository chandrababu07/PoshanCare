import { MealSection } from '../data/mockDiary';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BackendMealEntry {
  id: string;
  raw_id: number;
  meal_id: number;
  food_id: number;
  food_portion_id?: number | null;
  food_name: string;
  subtext: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  category_tag?: string | null;
  quantity: number;
  serving_gram: number;
  created_at: string;
}

export interface BackendMealSection {
  id: string; // 'breakfast', 'lunch', 'evening_snack', 'dinner', 'other'
  name: string;
  time: string;
  subtitle: string;
  icon_name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber?: number;
  items: BackendMealEntry[];
}

export interface BackendDailyDiaryResponse {
  date: string;
  grand_total_calories: number;
  grand_total_protein: number;
  grand_total_carbs: number;
  grand_total_fat: number;
  grand_total_fiber?: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_fiber?: number;
  caloric_status_text: string;
  meals: BackendMealSection[];
}

export interface CreateDiaryEntryPayload {
  meal_type: string;
  date: string; // YYYY-MM-DD
  food_id: number;
  food_portion_id?: number;
  quantity?: number;
  notes?: string;
}

export interface UpdateDiaryEntryPayload {
  quantity?: number;
  food_portion_id?: number;
}

/**
 * Map backend MealSection to frontend legacy MealSection format
 */
export function mapBackendMealSectionToFrontend(sec: BackendMealSection): MealSection {
  return {
    id: sec.id,
    name: sec.name,
    time: sec.time,
    subtitle: sec.subtitle,
    iconName: sec.icon_name,
    items: sec.items.map((item) => ({
      id: String(item.raw_id),
      foodName: item.food_name,
      subtext: item.subtext,
      serving: item.serving,
      calories: Math.round(item.calories),
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      categoryTag: item.category_tag || undefined,
    })),
  };
}

/**
 * Fetch daily diary for authenticated user
 */
export async function fetchDailyDiaryFromApi(
  dateStr: string
): Promise<{ data: BackendDailyDiaryResponse | null; isFallback: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/diary?date=${dateStr}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('User unauthenticated for diary endpoint. Using local state fallback.');
        return { data: null, isFallback: true };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const resData = (await response.json()) as BackendDailyDiaryResponse;
    return { data: resData, isFallback: false };
  } catch (error) {
    console.warn('Backend Diary API offline or unreachable. Using mock data fallback.', error);
    return { data: null, isFallback: true };
  }
}

/**
 * Create a new food entry in user's diary
 */
export async function addDiaryEntryToApi(
  payload: CreateDiaryEntryPayload
): Promise<BackendMealEntry | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/diary/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as BackendMealEntry;
  } catch (error) {
    console.warn('Add diary entry API error:', error);
    return null;
  }
}

/**
 * Update quantity/portion of existing entry
 */
export async function updateDiaryEntryInApi(
  rawEntryId: number,
  payload: UpdateDiaryEntryPayload
): Promise<BackendMealEntry | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/diary/entries/${rawEntryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as BackendMealEntry;
  } catch (error) {
    console.warn('Update diary entry API error:', error);
    return null;
  }
}

/**
 * Delete a diary entry
 */
export async function deleteDiaryEntryFromApi(rawEntryId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/diary/entries/${rawEntryId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.warn('Delete diary entry API error:', error);
    return false;
  }
}
