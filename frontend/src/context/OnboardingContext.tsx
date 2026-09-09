/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  fetchUserProfile,
  mapBackendProfileToOnboardingData,
  mapOnboardingDataToBackendPatch,
  patchUserProfile,
} from '../services/profileService';
import { useAuth } from './AuthContext';

export type BiologicalSex = 'female' | 'male' | 'unspecified';
export type UnitSystem = 'metric' | 'imperial';
export type CompositionIntent = 'standard' | 'custom';
export type LeanMassFocus = 'none' | 'lean_gain' | 'sarcopenia_prevent' | 'recomp';
export type PrimaryGoal = 'muscle' | 'maintain' | 'improve' | 'fat-loss';
export type ProgressionPace = 'gradual' | 'moderate';
export type ActivityLevel =
  | 'Sedentary'
  | 'Lightly Active'
  | 'Moderately Active'
  | 'Very Active'
  | 'Extremely Active';

export interface OnboardingData {
  // Profile
  fullName: string;
  age: number;
  biologicalSex: BiologicalSex;

  // Body Metrics
  unitSystem: UnitSystem;
  heightCm: number;
  weightKg: number;
  heightFt: number;
  heightIn: number;
  weightLbs: number;
  compositionIntent: CompositionIntent;
  targetMass: number;
  leanMassFocus: LeanMassFocus;

  // Goals
  primaryGoal: PrimaryGoal;
  pace: ProgressionPace;

  // Activity
  activityLevel: ActivityLevel;
  routines: string[];
  frequency: string;
  dailySteps: number;
}

const defaultOnboardingData: OnboardingData = {
  fullName: '',
  age: 34,
  biologicalSex: 'female',

  unitSystem: 'metric',
  heightCm: 163,
  weightKg: 56.4,
  heightFt: 5,
  heightIn: 4,
  weightLbs: 124.3,
  compositionIntent: 'standard',
  targetMass: 58.0,
  leanMassFocus: 'none',

  primaryGoal: 'maintain',
  pace: 'gradual',

  activityLevel: 'Moderately Active',
  routines: ['Strength Training', 'Cardio'],
  frequency: '3–4 days/week',
  dailySteps: 8000,
};

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>, step?: number) => void;
  resetData: () => void;
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
      const nextData = { ...prev, ...fields };

      // Progressive PATCH update to backend if authenticated
      if (user) {
        const patch = mapOnboardingDataToBackendPatch(fields, step);
        if (Object.keys(patch).length > 0) {
          patchUserProfile(patch).catch((err) => {
            console.warn('Progressive profile patch warning:', err);
          });
        }
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
      value={{ data, updateData, resetData, isLoadingProfile }}
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
