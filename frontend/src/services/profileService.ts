import { ActivityLevel, OnboardingData, PrimaryGoal } from '../context/OnboardingContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BackendProfileResponse {
  id: number;
  user_id: number;
  onboarding_step: number;
  onboarding_completed: boolean;
  profile_type?: 'child' | 'teen' | 'adult' | 'older_adult' | 'family' | null;
  date_of_birth?: string | null;
  country?: string | null;
  region?: string | null;
  preferred_language?: 'en' | 'te' | 'hi' | null;
  age: number | null;
  biological_sex: 'female' | 'male' | 'unspecified' | null;
  diet_type?: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'vegan' | 'other' | null;
  food_preferences?: string[] | null;
  food_avoidances?: string[] | null;
  meal_frequency?: string | null;
  meal_timings?: Record<string, string> | null;
  health_conditions?: string[] | null;
  unit_system: 'metric' | 'imperial' | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_mass_kg: number | null;
  composition_intent?: string | null;
  lean_mass_focus?: string | null;
  primary_goal: string | null;
  progression_pace?: string | null;
  activity_level: string | null;
  routines?: string[] | null;
  training_frequency?: string | null;
  daily_steps?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert Canonical Backend Profile to Frontend OnboardingData structure
 */
export function mapBackendProfileToOnboardingData(
  profile: BackendProfileResponse,
  existingName: string = 'User'
): OnboardingData {
  const heightCm = profile.height_cm ?? 163;
  const weightKg = profile.weight_kg ?? 56.4;
  const targetMassKg = profile.target_mass_kg ?? 58.0;

  // Convert metric to imperial for display support
  const totalInches = Math.round(heightCm / 2.54);
  const heightFt = Math.floor(totalInches / 12);
  const heightIn = totalInches % 12;
  const weightLbs = parseFloat((weightKg * 2.20462).toFixed(1));

  return {
    profileType: profile.profile_type ?? 'adult',
    fullName: existingName,
    dateOfBirth: profile.date_of_birth ?? '1992-05-15',
    age: profile.age ?? 34,
    biologicalSex: profile.biological_sex ?? 'female',
    country: profile.country ?? 'India',
    region: profile.region ?? '',
    preferredLanguage: profile.preferred_language ?? 'en',

    unitSystem: profile.unit_system ?? 'metric',
    heightCm,
    weightKg,
    heightFt: heightFt || 5,
    heightIn: heightIn || 4,
    weightLbs: weightLbs || 124.3,
    targetMass: targetMassKg,

    activityLevel: (profile.activity_level as ActivityLevel) ?? 'Moderately Active',
    primaryGoal: (profile.primary_goal as PrimaryGoal) ?? 'eat_healthier',

    dietType: profile.diet_type ?? 'vegetarian',
    foodPreferences: profile.food_preferences ?? ['South Indian', 'North Indian'],
    foodAvoidances: profile.food_avoidances ?? [],

    mealFrequency: profile.meal_frequency ?? '3 meals/day',
    breakfastTime: profile.meal_timings?.breakfast ?? '08:00',
    lunchTime: profile.meal_timings?.lunch ?? '13:00',
    dinnerTime: profile.meal_timings?.dinner ?? '20:00',

    healthConditions: profile.health_conditions ?? [],

    currentStep: profile.onboarding_step ?? 1,
  };
}

/**
 * Convert Frontend OnboardingData to Backend Profile PATCH Payload
 */
export function mapOnboardingDataToBackendPatch(
  data: Partial<OnboardingData>,
  step?: number
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (step !== undefined) patch.onboarding_step = step;
  if (data.profileType !== undefined) patch.profile_type = data.profileType;
  if (data.dateOfBirth !== undefined) patch.date_of_birth = data.dateOfBirth;
  if (data.country !== undefined) patch.country = data.country;
  if (data.region !== undefined) patch.region = data.region;
  if (data.preferredLanguage !== undefined) patch.preferred_language = data.preferredLanguage;
  if (data.age !== undefined) patch.age = data.age;
  if (data.biologicalSex !== undefined) patch.biological_sex = data.biologicalSex;
  if (data.dietType !== undefined) patch.diet_type = data.dietType;
  if (data.foodPreferences !== undefined) patch.food_preferences = data.foodPreferences;
  if (data.foodAvoidances !== undefined) patch.food_avoidances = data.foodAvoidances;
  if (data.mealFrequency !== undefined) patch.meal_frequency = data.mealFrequency;
  if (data.breakfastTime !== undefined || data.lunchTime !== undefined || data.dinnerTime !== undefined) {
    patch.meal_timings = {
      breakfast: data.breakfastTime ?? '08:00',
      lunch: data.lunchTime ?? '13:00',
      dinner: data.dinnerTime ?? '20:00',
    };
  }
  if (data.healthConditions !== undefined) patch.health_conditions = data.healthConditions;

  if (data.unitSystem !== undefined) patch.unit_system = data.unitSystem;
  if (data.heightCm !== undefined) patch.height_cm = data.heightCm;
  if (data.weightKg !== undefined) patch.weight_kg = data.weightKg;
  if (data.targetMass !== undefined) patch.target_mass_kg = data.targetMass;

  if (data.primaryGoal !== undefined) patch.primary_goal = data.primaryGoal;
  if (data.activityLevel !== undefined) patch.activity_level = data.activityLevel;

  return patch;
}

/**
 * Fetch profile for authenticated user
 */
export async function fetchUserProfile(): Promise<BackendProfileResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BackendProfileResponse;
  } catch (error) {
    console.warn('Backend API offline or unauthenticated. Using local state.', error);
    return null;
  }
}

/**
 * Patch profile data step progressively
 */
export async function patchUserProfile(
  patchData: Record<string, unknown>
): Promise<BackendProfileResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(patchData),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BackendProfileResponse;
  } catch (error) {
    console.warn('Backend patch profile offline or failed:', error);
    return null;
  }
}

/**
 * Finalize onboarding server-side
 */
export async function completeOnboardingSession(): Promise<BackendProfileResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error?.message || 'Incomplete onboarding validation failed.');
    }

    return (await response.json()) as BackendProfileResponse;
  } catch (error) {
    console.warn('Complete onboarding API warning:', error);
    throw error;
  }
}
