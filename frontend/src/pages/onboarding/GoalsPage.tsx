import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Scale,
  Leaf,
  Activity,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Heart,
  Brain,
  Users,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { useOnboarding, PrimaryGoal, ProgressionPace } from '../../context/OnboardingContext';

export const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(data.primaryGoal || 'improve');
  const [pace, setPace] = useState<ProgressionPace>(data.pace || 'gradual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goalOptions = [
    {
      id: 'improve' as PrimaryGoal,
      title: 'Eat Healthier & Feel Better',
      desc: 'Build balanced, joyful eating habits with nutrient-rich foods and simple meal choices.',
      badge: 'Balanced Living',
      icon: Leaf,
    },
    {
      id: 'maintain' as PrimaryGoal,
      title: 'Maintain Current Weight',
      desc: 'Keep your current weight steady while supporting daily energy, stamina, and digestion.',
      badge: 'Steady & Strong',
      icon: Scale,
    },
    {
      id: 'fat-loss' as PrimaryGoal,
      title: 'Manage Weight Sustainably',
      desc: 'Work toward a healthy weight at a comfortable, safe pace without restrictive rules.',
      badge: 'Sustainable Shift',
      icon: Activity,
    },
    {
      id: 'muscle' as PrimaryGoal,
      title: 'Build Strength & Muscle',
      desc: 'Fuel your active lifestyle with optimal protein and wholesome, energetic meals.',
      badge: 'Strength & Energy',
      icon: Dumbbell,
    },
    {
      id: 'fitness' as PrimaryGoal,
      title: 'Improve Fitness & Stamina',
      desc: 'Enhance your stamina, endurance, and workout recovery with targeted everyday nutrition.',
      badge: 'Active & Fit',
      icon: Sparkles,
    },
    {
      id: 'wellness' as PrimaryGoal,
      title: 'Support Overall Wellness',
      desc: 'Focus on heart health, immunity, deep sleep, and feeling vibrant every day.',
      badge: 'Vitality Focus',
      icon: Heart,
    },
    {
      id: 'daily-nutrition' as PrimaryGoal,
      title: 'Improve Daily Nutrition',
      desc: 'Learn practical food swaps, mindful snacking, and easy meal planning techniques.',
      badge: 'Habit Building',
      icon: Brain,
    },
    {
      id: 'family-nutrition' as PrimaryGoal,
      title: 'Family & Elder Support',
      desc: 'Create wholesome, easy-to-digest recipes that nourish children, adults, and seniors alike.',
      badge: 'Family First',
      icon: Users,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateData({ primaryGoal, pace }, 6);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/diet-preferences');
    }, 400);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium text-xs tracking-wider uppercase">
              Step 6 of 10
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs tracking-wide">
              • Your Wellness Path
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold tracking-tight">
            What is your main goal right now?
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Select the focus that matters most to you today. You can adjust your preferences or add secondary goals anytime.
          </p>
        </div>
      </div>

      {/* 8 Goal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {goalOptions.map((goal) => {
          const IconComponent = goal.icon;
          const isSelected = primaryGoal === goal.id;

          return (
            <div
              key={goal.id}
              onClick={() => setPrimaryGoal(goal.id)}
              className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                isSelected
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm hover:shadow'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950'
                  }`}
                >
                  <IconComponent className="w-5.5 h-5.5" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {goal.badge}
                  </span>
                  <h3
                    className={`text-base font-bold ${
                      isSelected ? 'text-emerald-950 dark:text-emerald-100' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {goal.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {goal.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progression Pace & Info Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pace Selector */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg text-slate-900 dark:text-white font-bold">
                How would you like to pace your journey?
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We recommend comfortable, gradual changes so your body and routine adapt naturally.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gradual Pace */}
            <div
              onClick={() => setPace('gradual')}
              className={`relative p-5 rounded-xl cursor-pointer transition-all flex flex-col gap-2.5 border ${
                pace === 'gradual'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="px-2 py-0.5 w-fit rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    Recommended
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    Gradual &amp; Steady Pace
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    pace === 'gradual' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {pace === 'gradual' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Great for smooth habit formation, high daily energy, and long-term sustainability without stress.
              </p>

              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mt-1">
                <Smile className="w-4 h-4" />
                <span>Easiest to maintain daily</span>
              </div>
            </div>

            {/* Moderate Pace */}
            <div
              onClick={() => setPace('moderate')}
              className={`relative p-5 rounded-xl cursor-pointer transition-all flex flex-col gap-2.5 border ${
                pace === 'moderate'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="px-2 py-0.5 w-fit rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                    Focused Path
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    Focused Moderate Pace
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    pace === 'moderate' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {pace === 'moderate' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Designed for consistent weekly milestones while keeping nutrition well-balanced and satisfying.
              </p>

              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-semibold mt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Balanced progress check-ins</span>
              </div>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/onboarding/activity')}
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
                  <span>Saving Goal...</span>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  <span>Continue to Diet Preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Friendly Guidance Card */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <h3 className="font-bold text-base text-emerald-100">Smart Customization</h3>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              PoshanCare tailors meal plans to honor local ingredients, home cooking habits, and seasonal availability.
            </p>
            <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800/50 text-xs text-emerald-200 leading-normal">
              💡 <strong>Tip:</strong> Next, you will tell us about your dietary pattern (Vegetarian, Non-Veg, Vegan) and regional cuisine favorites!
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GoalsPage;
