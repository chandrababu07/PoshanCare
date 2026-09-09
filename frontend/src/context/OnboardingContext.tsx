/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchUserProfile,
  mapBackendProfileToOnboardingData,
  mapOnboardingDataToBackendPatch,
  patchUserProfile,
} from '../services/profileService';
import { useAuth } from './AuthContext';

export type ProfileType = 'child' | 'teen' | 'adult' | 'older_adult' | 'family';
export type BiologicalSex = 'female' | 'male' | 'unspecified';
export type UnitSystem = 'metric' | 'imperial';
export type PreferredLanguage = 'en' | 'te' | 'hi';
export type DietType = 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'vegan' | 'other';
export type ActivityLevel =
  | 'Mostly Inactive'
  | 'Lightly Active'
  | 'Moderately Active'
  | 'Very Active'
  | 'Extremely Active';
export type PrimaryGoal =
  | 'eat_healthier'
  | 'maintain'
  | 'manage_weight'
  | 'build_strength'
  | 'fitness'
  | 'wellness'
  | 'daily_nutrition'
  | 'family_nutrition'
  | 'muscle'
  | 'improve'
  | 'fat-loss'
  | 'daily-nutrition'
  | 'family-nutrition';

export type ProgressionPace = 'gradual' | 'moderate' | 'rapid';
export type CompositionIntent = 'maintain' | 'recomp' | 'hypertrophy' | 'deficit' | 'standard' | 'custom';
export type LeanMassFocus = 'moderate' | 'high' | 'ultra';

export interface OnboardingData {
  // Step 2: Persona / Profile Target
  profileType: ProfileType;

  // Step 3: Demographics & Identity
  fullName: string;
  dateOfBirth: string;
  age: number;
  biologicalSex: BiologicalSex;
  country: string;
  region: string;
  preferredLanguage: PreferredLanguage;

  // Step 4: Body Metrics
  unitSystem: UnitSystem;
  heightCm: number;
  weightKg: number;
  heightFt: number;
  heightIn: number;
  weightLbs: number;
  targetMass: number;
  compositionIntent?: CompositionIntent | string;
  leanMassFocus?: LeanMassFocus | string;

  // Step 5: Activity
  activityLevel: ActivityLevel;
  routines?: string[];
  frequency?: string;
  dailySteps?: number;

  // Step 6: Goals
  primaryGoal: PrimaryGoal;
  pace?: ProgressionPace;

  // Step 7: Food & Preferences
  dietType: DietType;
  foodPreferences: string[];
  foodAvoidances: string[];

  // Step 8: Meal Frequency & Habits
  mealFrequency: number | string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  mealTimings?: Record<string, string>;

  // Step 9: Health Context
  healthConditions: string[];

  // Navigation Step Tracker
  currentStep: number;
}

export const defaultOnboardingData: OnboardingData = {
  profileType: 'adult',
  fullName: '',
  dateOfBirth: '1992-05-15',
  age: 34,
  biologicalSex: 'female',
  country: 'India',
  region: '',
  preferredLanguage: 'en',

  unitSystem: 'metric',
  heightCm: 163,
  weightKg: 56.4,
  heightFt: 5,
  heightIn: 4,
  weightLbs: 124.3,
  targetMass: 58.0,
  compositionIntent: 'maintain',
  leanMassFocus: 'moderate',

  activityLevel: 'Moderately Active',
  routines: ['Walking', 'Light Exercise'],
  frequency: '3-4 days/week',
  dailySteps: 7500,

  primaryGoal: 'improve',
  pace: 'gradual',

  dietType: 'vegetarian',
  foodPreferences: ['South Indian', 'North Indian'],
  foodAvoidances: [],

  mealFrequency: 3,
  breakfastTime: '08:30',
  lunchTime: '13:30',
  dinnerTime: '20:30',
  mealTimings: {
    breakfast: '08:30',
    lunch: '13:30',
    snack: '17:00',
    dinner: '20:30',
  },

  healthConditions: [],

  currentStep: 1,
};

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>, step?: number) => void;
  resetData: () => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isLoadingProfile: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<OnboardingData>({
    ...defaultOnboardingData,
    fullName: user?.full_name ?? '',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);

  // Hydrate onboarding profile data from backend on mount if user is authenticated
  useEffect(() => {
    let isMounted = true;

    async function syncProfile() {
      if (!user) {
        setData({ ...defaultOnboardingData, fullName: '' });
        return;
      }
      setIsLoadingProfile(true);
      try {
        const backendProfile = await fetchUserProfile();
        if (isMounted && backendProfile) {
          const mapped = mapBackendProfileToOnboardingData(backendProfile, user.full_name ?? 'User');
          setData((prev) => ({
            ...prev,
            ...mapped,
            fullName: user.full_name ?? mapped.fullName ?? 'User',
            currentStep: backendProfile.onboarding_step && backendProfile.onboarding_step > 0 ? backendProfile.onboarding_step : prev.currentStep,
          }));
        } else if (isMounted) {
          setData((prev) => ({
            ...prev,
            fullName: user.full_name ?? 'User',
          }));
        }
      } catch (err) {
        console.warn('Profile sync fallback:', err);
        if (isMounted) {
          setData((prev) => ({
            ...prev,
            fullName: user.full_name ?? 'User',
          }));
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    syncProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const updateData = (fields: Partial<OnboardingData>, step?: number) => {
    setData((prev) => {
      const nextStepNum = step !== undefined ? step : prev.currentStep;
      const nextData = { ...prev, ...fields, currentStep: nextStepNum };

      // Progressive PATCH update to backend if authenticated
      if (user) {
        const patch = mapOnboardingDataToBackendPatch(fields, nextStepNum);
        if (Object.keys(patch).length > 0) {
          patchUserProfile(patch).catch((err) => {
            console.warn('Progressive profile patch warning:', err);
          });
        }
      }

      return nextData;
    });
  };

  const setStep = (step: number) => {
    const clamped = Math.max(1, Math.min(11, step));
    updateData({ currentStep: clamped }, clamped);
  };

  const nextStep = () => {
    setData((prev) => {
      const nextS = Math.min(11, prev.currentStep + 1);
      const nextData = { ...prev, currentStep: nextS };
      if (user) {
        patchUserProfile({ onboarding_step: nextS }).catch(() => {});
      }
      return nextData;
    });
  };

  const prevStep = () => {
    setData((prev) => {
      const prevS = Math.max(1, prev.currentStep - 1);
      const nextData = { ...prev, currentStep: prevS };
      if (user) {
        patchUserProfile({ onboarding_step: prevS }).catch(() => {});
      }
      return nextData;
    });
  };

  const resetData = () => {
    setData({
      ...defaultOnboardingData,
      fullName: user?.full_name ?? '',
    });
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        resetData,
        setStep,
        nextStep,
        prevStep,
        isLoadingProfile,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
