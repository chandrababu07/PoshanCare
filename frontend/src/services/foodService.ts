import { FoodItem, MOCK_FOOD_DATABASE } from '../data/mockFoods';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BackendFoodPortion {
  id: number;
  food_id: number;
  portion_name: string;
  gram_weight: number;
  is_default: boolean;
  created_at: string;
}

export interface BackendFoodItem {
  id: number;
  user_id?: number | null;
  ifct_code?: string | null;
  name: string;
  alternate_name?: string | null;
  description?: string | null;
  category: string;
  region: string;
  is_vegetarian: boolean;
  image_url?: string | null;
  serving_size_name: string;
  serving_size_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g?: number;
  sodium_mg?: number;
  source?: string;
  is_verified?: boolean;
  is_custom?: boolean;
  is_favorite?: boolean;
  calories_per_100g: number;
  portions: BackendFoodPortion[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedFoodResponse {
  items: BackendFoodItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FetchFoodsParams {
  search?: string;
  category?: string;
  region?: string;
  is_vegetarian?: boolean;
  is_custom_only?: boolean;
  is_favorite_only?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateCustomFoodPayload {
  name: string;
  alternate_name?: string;
  description?: string;
  category: string;
  region: string;
  is_vegetarian: boolean;
  serving_size_name: string;
  serving_size_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g?: number;
  sodium_mg?: number;
}

/**
 * Map backend FoodItem to frontend legacy FoodItem structure for UI rendering compatibility
 */
export function mapBackendFoodToFrontend(item: BackendFoodItem): FoodItem {
  return {
    id: `food-${item.id}`,
    rawId: item.id,
    name: item.name,
    alternateName: item.alternate_name || undefined,
    description: item.description || undefined,
    category: item.category,
    region: item.region,
    servingSize: `${item.serving_size_name} (${Math.round(item.serving_size_g)}g)`,
    servingGram: item.serving_size_g,
    calories: Math.round(item.calories),
    protein: parseFloat(item.protein_g.toFixed(1)),
    carbs: parseFloat(item.carbs_g.toFixed(1)),
    fat: parseFloat(item.fat_g.toFixed(1)),
    fiber: parseFloat(item.fiber_g.toFixed(1)),
    sugar: item.sugar_g ? parseFloat(item.sugar_g.toFixed(1)) : 0,
    sodium: item.sodium_mg ? parseFloat(item.sodium_mg.toFixed(1)) : 0,
    ifctCode: item.ifct_code || undefined,
    imageUrl: item.image_url || undefined,
    isVegetarian: item.is_vegetarian,
    isCustom: Boolean(item.is_custom || item.user_id),
    isFavorite: Boolean(item.is_favorite),
  };
}

/**
 * Fetch paginated foods list from API with optional search and filters
 */
export async function fetchFoodsFromApi(
  params: FetchFoodsParams = {}
): Promise<{ items: FoodItem[]; rawItems: BackendFoodItem[]; total: number }> {
  try {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.region && params.region !== 'All') query.append('region', params.region);
    if (params.is_vegetarian !== undefined) query.append('is_vegetarian', String(params.is_vegetarian));
    if (params.is_custom_only) query.append('is_custom_only', 'true');
    if (params.is_favorite_only) query.append('is_favorite_only', 'true');
    if (params.page) query.append('page', String(params.page));
    if (params.page_size) query.append('page_size', String(params.page_size));
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const url = `${API_BASE_URL}/foods?${query.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error HTTP ${response.status}`);
    }

    const data = (await response.json()) as PaginatedFoodResponse;
    const items = data.items.map(mapBackendFoodToFrontend);

    return {
      items,
      rawItems: data.items,
      total: data.total,
    };
  } catch (error) {
    console.warn('Backend Food API unreachable. Falling back to local dataset.', error);

    // Fallback filter over mock data
    let filtered = [...MOCK_FOOD_DATABASE];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.alternateName && f.alternateName.toLowerCase().includes(q)) ||
          f.category.toLowerCase().includes(q)
      );
    }
    if (params.category && params.category !== 'All') {
      filtered = filtered.filter((f) => f.category === params.category);
    }

    return {
      items: filtered,
      rawItems: [],
      total: filtered.length,
    };
  }
}

/**
 * Create custom food in API
 */
export async function createCustomFoodInApi(
  payload: CreateCustomFoodPayload
): Promise<FoodItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/foods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const detailMsg = errJson?.detail || errJson?.error?.message || `HTTP ${response.status}`;
      throw new Error(detailMsg);
    }

    const data = (await response.json()) as BackendFoodItem;
    return mapBackendFoodToFrontend(data);
  } catch (error) {
    console.warn('Create custom food API error:', error);
    throw error;
  }
}

/**
 * Fetch user's recent foods
 */
export async function fetchRecentFoodsFromApi(): Promise<FoodItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/foods/recent`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return [];
    const data = (await response.json()) as BackendFoodItem[];
    return data.map(mapBackendFoodToFrontend);
  } catch (error) {
    console.warn('Recent foods API error:', error);
    return [];
  }
}

/**
 * Fetch user's favorite foods
 */
export async function fetchFavoriteFoodsFromApi(): Promise<FoodItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/foods/favorites`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!response.ok) return [];
    const data = (await response.json()) as BackendFoodItem[];
    return data.map(mapBackendFoodToFrontend);
  } catch (error) {
    console.warn('Favorite foods API error:', error);
    return [];
  }
}

/**
 * Toggle favorite food status in API
 */
export async function toggleFavoriteFoodInApi(
  foodId: number,
  isFavorite: boolean
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/foods/${foodId}/favorite`, {
      method: isFavorite ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return response.ok;
  } catch (error) {
    console.warn('Toggle favorite food API error:', error);
    return false;
  }
}

/**
 * Fetch food categories list from API
 */
export async function fetchCategoriesFromApi(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/foods/categories`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as string[];
  } catch (error) {
    console.warn('Categories API offline:', error);
    return [
      'Snacks & Street Food',
      'Rice & Millets',
      'Dal & Pulses',
      'Curries & Dairy',
      'Egg & Poultry',
      'Fruits & Nuts',
      'Dairy',
      'Breads & Flatbreads',
    ];
  }
}

/**
 * Fetch regional origins list from API
 */
export async function fetchRegionsFromApi(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/foods/regions`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as string[];
  } catch (error) {
    console.warn('Regions API offline:', error);
    return ['Pan-India', 'South India', 'North India', 'South / West', 'North / West'];
  }
}
