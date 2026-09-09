import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Coffee,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

export const MealHabitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [mealFrequency, setMealFrequency] = useState<number>(
    typeof data.mealFrequency === 'number' ? data.mealFrequency : 3
  );
  const [mealTimings, setMealTimings] = useState<Record<string, string>>(
    data.mealTimings || {
      breakfast: '08:30',
      lunch: '13:30',
      snack: '17:00',
      dinner: '20:30',
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const frequencyOptions = [
    { value: 2, label: '2 Meals / day', desc: 'Branch & Dinner or Lunch & Dinner' },
    { value: 3, label: '3 Meals / day', desc: 'Standard Breakfast, Lunch & Dinner' },
    { value: 4, label: '4 Meals / day', desc: 'Breakfast, Lunch, Evening Snack & Dinner' },
    { value: 5, label: '5+ Meals / day', desc: 'Frequent smaller meals & light snacks' },
  ];

  const timingFields = [
    { key: 'breakfast', label: 'Breakfast', icon: Coffee, defaultTime: '08:30' },
    { key: 'lunch', label: 'Lunch', icon: Sun, defaultTime: '13:30' },
    { key: 'snack', label: 'Evening Snack', icon: Sunset, defaultTime: '17:00' },
    { key: 'dinner', label: 'Dinner', icon: Moon, defaultTime: '20:30' },
  ];

  const handleTimingChange = (key: string, value: string) => {
    setMealTimings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateData(
      {
        mealFrequency,
        mealTimings,
      },
      8
    );

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/health-context');
    }, 400);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium text-xs tracking-wider uppercase">
              Step 8 of 10
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs tracking-wide">
              • Daily Meal Routine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold tracking-tight">
            How do you structure your daily meals?
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Sharing your preferred meal frequency and approximate timings helps us generate recipes and gentle reminders at the right times.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Meal Frequency */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Typical Daily Meal Frequency
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {frequencyOptions.map((opt) => {
              const isSelected = mealFrequency === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => setMealFrequency(opt.value)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    {opt.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Approximate Meal Timings (Optional) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Approximate Meal Timings (Optional)
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Feel free to tweak or leave defaults
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {timingFields.map((field) => {
              const IconComp = field.icon;
              const currentValue = mealTimings[field.key] || field.defaultTime;

              return (
                <div
                  key={field.key}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-sm">
                    <IconComp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{field.label}</span>
                  </div>
                  <input
                    type="time"
                    value={currentValue}
                    onChange={(e) => handleTimingChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/onboarding/diet-preferences')}
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
                <span>Saving Schedule...</span>
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <span>Continue to Health Context</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MealHabitsPage;
