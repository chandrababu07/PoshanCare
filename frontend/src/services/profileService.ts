import { OnboardingData } from '../context/OnboardingContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface BackendProfileResponse {
  id: number;
  user_id: number;
  onboarding_step: number;
  onboarding_completed: boolean;
  age: number | null;
  biological_sex: 'female' | 'male' | 'unspecified' | null;
  unit_system: 'metric' | 'imperial' | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_mass_kg: number | null;
  composition_intent: 'standard' | 'custom' | null;
  lean_mass_focus: 'none' | 'lean_gain' | 'sarcopenia_prevent' | 'recomp' | null;
  primary_goal: 'muscle' | 'maintain' | 'improve' | 'fat-loss' | null;
  progression_pace: 'gradual' | 'moderate' | null;
  activity_level:
    | 'Sedentary'
    | 'Lightly Active'
    | 'Moderately Active'
    | 'Very Active'
    | 'Extremely Active'
    | null;
  routines: string[] | null;
  training_frequency: string | null;
  daily_steps: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert Canonical Backend Profile to Frontend OnboardingData structure
 */
export function mapBackendProfileToOnboardingData(
  profile: BackendProfileResponse,
  existingName: string = 'Rahul Sharma'
): OnboardingData {
  const heightCm = profile.height_cm || 163;
  const weightKg = profile.weight_kg || 56.4;
  const targetMassKg = profile.target_mass_kg || 58.0;

  // Convert metric to imperial for display support
  const totalInches = Math.round(heightCm / 2.54);
  const heightFt = Math.floor(totalInches / 12);
  const heightIn = totalInches % 12;
  const weightLbs = parseFloat((weightKg * 2.20462).toFixed(1));

  return {
    fullName: existingName,
    age: profile.age || 34,
    biologicalSex: profile.biological_sex || 'female',
    unitSystem: profile.unit_system || 'metric',
    heightCm,
    weightKg,
    heightFt: heightFt || 5,
    heightIn: heightIn || 4,
    weightLbs: weightLbs || 124.3,
    compositionIntent: profile.composition_intent || 'standard',
    targetMass: targetMassKg,
    leanMassFocus: profile.lean_mass_focus || 'none',
    primaryGoal: profile.primary_goal || 'maintain',
    pace: profile.progression_pace || 'gradual',
    activityLevel: profile.activity_level || 'Moderately Active',
    routines: profile.routines || ['Strength Training', 'Cardio'],
    frequency: profile.training_frequency || '3–4 days/week',
    dailySteps: profile.daily_steps || 8000,
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
  if (data.age !== undefined) patch.age = data.age;
  if (data.biologicalSex !== undefined) patch.biological_sex = data.biologicalSex;
  if (data.unitSystem !== undefined) patch.unit_system = data.unitSystem;
  if (data.heightCm !== undefined) patch.height_cm = data.heightCm;
  if (data.weightKg !== undefined) patch.weight_kg = data.weightKg;
  if (data.targetMass !== undefined) patch.target_mass_kg = data.targetMass;
  if (data.compositionIntent !== undefined) patch.composition_intent = data.compositionIntent;
  if (data.leanMassFocus !== undefined) patch.lean_mass_focus = data.leanMassFocus;
  if (data.primaryGoal !== undefined) patch.primary_goal = data.primaryGoal;
  if (data.pace !== undefined) patch.progression_pace = data.pace;
  if (data.activityLevel !== undefined) patch.activity_level = data.activityLevel;
  if (data.routines !== undefined) patch.routines = data.routines;
  if (data.frequency !== undefined) patch.training_frequency = data.frequency;
  if (data.dailySteps !== undefined) patch.daily_steps = data.dailySteps;

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
