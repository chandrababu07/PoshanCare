import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Edit,
  User,
  Ruler,
  Flag,
  Activity,
  Utensils,
  Rocket,
  Sparkles,
  Loader2,
  ArrowRight,
  Clock,
  HeartPulse,
  Smile,
} from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { completeOnboardingSession } from '../../services/profileService';

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const [simState, setSimState] = useState<'review' | 'success'>('review');
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionStepText, setCompletionStepText] = useState('Saving your preferences...');

  const getBMI = () => {
    if (!data.heightCm || !data.weightKg) return '21.2';
    const hM = data.heightCm / 100;
    return (data.weightKg / (hM * hM)).toFixed(1);
  };

  const getPersonaLabel = () => {
    switch (data.profileType) {
      case 'child':
        return 'Child (Age 5-12)';
      case 'teen':
        return 'Teen (Age 13-17)';
      case 'adult':
        return 'Adult (Age 18-59)';
      case 'older_adult':
        return 'Senior / Elder (Age 60+)';
      case 'family':
        return 'Family Household';
      default:
        return 'Adult';
    }
  };

  const getGoalTitle = () => {
    switch (data.primaryGoal) {
      case 'improve':
      case 'eat_healthier':
        return 'Eat Healthier & Feel Better';
      case 'maintain':
        return 'Maintain Weight & Steady Energy';
      case 'fat-loss':
      case 'manage_weight':
        return 'Manage Weight Sustainably';
      case 'muscle':
      case 'build_strength':
        return 'Build Strength & Lean Muscle';
      case 'fitness':
        return 'Improve Fitness & Stamina';
      case 'wellness':
        return 'Support Overall Vitality';
      case 'daily-nutrition':
      case 'daily_nutrition':
        return 'Improve Daily Nutrition Habits';
      case 'family-nutrition':
      case 'family_nutrition':
        return 'Family & Elder Wholesome Support';
      default:
        return 'Eat Healthier & Feel Better';
    }
  };

  const handleCompleteSequence = async () => {
    setIsCompleting(true);
    setCompletionStepText('Calibrating your daily targets...');

    try {
      await completeOnboardingSession();
    } catch (err) {
      console.warn('Backend completion warning:', err);
    }

    setTimeout(() => {
      setCompletionStepText('Preparing your PoshanCare workspace...');
    }, 900);

    setTimeout(() => {
      setIsCompleting(false);
      setSimState('success');
    }, 1800);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium text-xs tracking-wider uppercase">
              Step 10 of 10
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> 100% Ready to Start
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold tracking-tight">
            You're all set, {data.fullName || 'friend'}! 🎉
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Please take a quick moment to review your personalized setup. You can easily adjust any section before entering your PoshanCare dashboard.
          </p>
        </div>
      </div>

      {/* Main Review View */}
      {simState === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary Cards */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  Your Profile Overview
                </span>
              </div>
            </div>

            {/* Card 1: Persona & Basic Info */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      01 • Persona &amp; Basic Info
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {data.fullName || 'User'} ({getPersonaLabel()})
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/profile"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {data.age ? `${data.age} Years Old` : 'Age set'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                  Country: {data.country || 'India'} ({data.region || 'South India'})
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Language: {data.preferredLanguage || 'English'}
                </span>
              </div>
            </div>

            {/* Card 2: Body Metrics */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      02 • Body Metrics
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {data.heightCm} cm • {data.weightKg} kg
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/body-metrics"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Estimated BMI: {getBMI()} kg/m²
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                  Units: {data.unitSystem === 'metric' ? 'Metric (cm/kg)' : 'Imperial (ft-in/lbs)'}
                </span>
              </div>
            </div>

            {/* Card 3: Activity Level */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      03 • Daily Activity Profile
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white capitalize">
                      {data.activityLevel ? data.activityLevel.replace('_', ' ') : 'Moderately Active'} • ~{(data.dailySteps || 7500).toLocaleString()} steps/day
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/activity"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
            </div>

            {/* Card 4: Primary Goal */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      04 • Primary Wellness Focus
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {getGoalTitle()}
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/goals"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 capitalize font-medium">
                  {data.pace} Progression Pace
                </span>
              </div>
            </div>

            {/* Card 5: Diet Preferences & Avoidances */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      05 • Dietary Style &amp; Avoidances
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white capitalize">
                      {data.dietType?.replace('_', ' ') || 'Vegetarian'}
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/diet-preferences"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {data.foodPreferences && data.foodPreferences.map((pref) => (
                  <span key={pref} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {pref}
                  </span>
                ))}
                {data.foodAvoidances && data.foodAvoidances.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                    Avoids: {data.foodAvoidances.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Card 6: Meal Habits & Schedule */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      06 • Meal Habits &amp; Timing
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {data.mealFrequency || 3} Meals / day
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/meal-habits"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
            </div>

            {/* Card 7: Health Considerations */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      07 • Health Considerations
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {data.healthConditions?.join(', ') || 'General Wellness'}
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/health-context"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Starting Plan Summary Card */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-28">
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 shadow-md flex flex-col gap-6 relative overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    Your Tailored Plan
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase">
                  Ready
                </span>
              </div>

              {/* Energy Target */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-1 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estimated Daily Energy Target
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    2,050
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    kcal / day
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Balanced to support your primary goal without extreme deficits.
                </p>
              </div>

              {/* Macro & Fiber Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Protein</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white mt-1">85g / day</span>
                  <span className="text-xs text-slate-500 mt-0.5">Wholesome sources</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Dietary Fiber</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white mt-1">30g / day</span>
                  <span className="text-xs text-slate-500 mt-0.5">Digestion &amp; Satiety</span>
                </div>
              </div>

              {/* Complete Setup CTA Button */}
              <button
                type="button"
                disabled={isCompleting}
                onClick={handleCompleteSequence}
                className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer font-bold disabled:opacity-80"
              >
                {isCompleting ? (
                  <>
                    <span>{completionStepText}</span>
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>Complete Setup &amp; Start</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration / Final Modal */}
      {simState === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col gap-6 relative border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Welcome to PoshanCare
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Your Nutrition Journey Begins Now! 🌟
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                Your personalized nutrition plan has been saved. We're excited to support your health and daily wellness journey every step of the way.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-center gap-2">
              <Smile className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>You can update your goals or dietary preferences anytime from your profile settings!</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/app')}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
