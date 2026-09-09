import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  Globe,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from 'lucide-react';
import { useOnboarding, DietType } from '../../context/OnboardingContext';

export const DietPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [dietType, setDietType] = useState<DietType>(data.dietType || 'vegetarian');
  const [foodPreferences, setFoodPreferences] = useState<string[]>(
    data.foodPreferences && data.foodPreferences.length > 0
      ? data.foodPreferences
      : ['South Indian']
  );
  const [foodAvoidances, setFoodAvoidances] = useState<string[]>(data.foodAvoidances || []);
  const [customAvoidance, setCustomAvoidance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dietTypeOptions: { id: DietType; label: string; desc: string; icon: string }[] = [
    {
      id: 'vegetarian',
      label: 'Vegetarian',
      desc: 'Plant-based diet including dairy and honey. Rich in pulses, grains, and veggies.',
      icon: '🥦',
    },
    {
      id: 'eggetarian',
      label: 'Eggetarian',
      desc: 'Vegetarian diet plus eggs for extra protein and quick breakfast options.',
      icon: '🥚',
    },
    {
      id: 'non_vegetarian',
      label: 'Non-Vegetarian',
      desc: 'Includes poultry, fish, meat, dairy, eggs, and plant-based wholesome foods.',
      icon: '🍗',
    },
    {
      id: 'vegan',
      label: '100% Vegan',
      desc: 'Strictly plant-based. Free from dairy, eggs, honey, or animal-derived products.',
      icon: '🌱',
    },
    {
      id: 'other',
      label: 'Flexible / Other',
      desc: 'Custom dietary pattern combining different food styles as preferred.',
      icon: '🥗',
    },
  ];

  const regionalCuisines = [
    'South Indian (Idli, Dosa, Rice & Sambar)',
    'North Indian (Roti, Dal, Paneer & Sabzi)',
    'East Indian (Rice, Fish, Mustard & Greens)',
    'West Indian (Gujarati / Maharashtrian Thali)',
    'Continental & Global',
    'Mediterranean & Salads',
    'Simple Home Cooking',
  ];

  const commonAvoidances = [
    'Lactose / Dairy',
    'Gluten / Wheat',
    'Peanuts & Tree Nuts',
    'Seafood / Shellfish',
    'Soy',
    'Refined Sugars',
    'Deep Fried Foods',
  ];

  const togglePreference = (pref: string) => {
    if (foodPreferences.includes(pref)) {
      setFoodPreferences(foodPreferences.filter((p) => p !== pref));
    } else {
      setFoodPreferences([...foodPreferences, pref]);
    }
  };

  const toggleAvoidance = (item: string) => {
    if (foodAvoidances.includes(item)) {
      setFoodAvoidances(foodAvoidances.filter((a) => a !== item));
    } else {
      setFoodAvoidances([...foodAvoidances, item]);
    }
  };

  const handleAddCustomAvoidance = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customAvoidance.trim()) {
      e.preventDefault();
      if (!foodAvoidances.includes(customAvoidance.trim())) {
        setFoodAvoidances([...foodAvoidances, customAvoidance.trim()]);
      }
      setCustomAvoidance('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateData(
      {
        dietType,
        foodPreferences,
        foodAvoidances,
      },
      7
    );

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/meal-habits');
    }, 400);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium text-xs tracking-wider uppercase">
              Step 7 of 10
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs tracking-wide">
              • Dietary &amp; Cuisine Preferences
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold tracking-tight">
            What foods do you enjoy?
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Tell us about your dietary choices, favorite regional flavors, and any ingredients you prefer to avoid.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Section 1: Diet Pattern */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Primary Dietary Pattern
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {dietTypeOptions.map((opt) => {
              const isSelected = dietType === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setDietType(opt.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{opt.icon}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {opt.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    {opt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Regional Cuisines & Preferred Foods */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Favorite Regional Cuisines &amp; Flavors
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select all that apply. PoshanCare prioritizes recipes from your favorite food traditions.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {regionalCuisines.map((cuisine) => {
              const isSelected = foodPreferences.includes(cuisine);
              return (
                <button
                  type="button"
                  key={cuisine}
                  onClick={() => togglePreference(cuisine)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{cuisine}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Food Avoidances / Allergies */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Foods You Prefer to Avoid or Allergies
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We will ensure your recommended meal suggestions exclude these items.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {commonAvoidances.map((item) => {
              const isSelected = foodAvoidances.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleAvoidance(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 max-w-md pt-2">
            <input
              type="text"
              value={customAvoidance}
              onChange={(e) => setCustomAvoidance(e.target.value)}
              onKeyDown={handleAddCustomAvoidance}
              placeholder="Add another ingredient to avoid (press Enter)..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/onboarding/goals')}
            className="px-5 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2 font-medium text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span>Saving Preferences...</span>
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <span>Continue to Meal Habits</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DietPreferencesPage;
