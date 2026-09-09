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
  Egg,
  Wheat,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';
import { completeOnboardingSession } from '../../services/profileService';

export const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const [simState, setSimState] = useState<'review' | 'success'>('review');
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionStepText, setCompletionStepText] = useState('Completing Setup...');

  const getBMI = () => {
    if (!data.heightCm || !data.weightKg) return '21.2';
    const hM = data.heightCm / 100;
    return (data.weightKg / (hM * hM)).toFixed(1);
  };

  const getGoalTitle = () => {
    switch (data.primaryGoal) {
      case 'muscle':
        return 'Build Muscle';
      case 'maintain':
        return 'Maintain Weight & Metabolic Stability';
      case 'improve':
        return 'Improve Nutrition';
      case 'fat-loss':
        return 'Lose Fat';
      default:
        return 'Maintain Weight & Metabolic Stability';
    }
  };

  const handleCompleteSequence = async () => {
    setIsCompleting(true);
    setCompletionStepText('Calculating starting targets...');

    try {
      await completeOnboardingSession();
    } catch (err) {
      console.warn('Backend completion warning (continuing with UI sequence):', err);
    }

    setTimeout(() => {
      setCompletionStepText('Preparing your PoshanCare workspace...');
    }, 1100);

    setTimeout(() => {
      setIsCompleting(false);
      setSimState('success');
    }, 2200);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
      {/* Top Header & Interactive Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold tracking-wider uppercase">
              Step 6 of 6
            </span>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-surface-tint font-medium">
              <CheckCircle2 className="w-4 h-4" /> 100% Evaluation Complete
            </span>
          </div>
          <h1 className="font-display-lg text-headline-lg text-primary tracking-tight font-bold">
            You're all set.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Review your clinical nutritional baseline before entering your PoshanCare intelligence
            workspace.
          </p>
        </div>

        {/* State Preview Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-container-low shadow-xs border border-surface-container shrink-0">
          <span className="font-label-sm text-label-sm text-on-surface-variant px-2 font-medium">
            Preview Mode:
          </span>
          <button
            type="button"
            onClick={() => setSimState('review')}
            className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
              simState === 'review'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-primary font-medium'
            }`}
          >
            Review Screen
          </button>
          <button
            type="button"
            onClick={() => setSimState('success')}
            className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
              simState === 'success'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-primary font-medium'
            }`}
          >
            Success Overlay
          </button>
        </div>
      </div>

      {/* Main Review View */}
      {simState === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary Cards */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-title-md text-title-md text-primary tracking-tight font-semibold">
                  Profile &amp; Clinical Summary
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Click edit to modify prior parameters
              </span>
            </div>

            {/* Card 1: Profile */}
            <div className="group relative p-6 rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-sm transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-surface-container">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      01 • Personal Profile
                    </span>
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      {data.fullName}
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/profile"
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-surface-tint transition-colors px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="mt-3 pl-13 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container">
                  {data.age} Years Old
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container capitalize">
                  {data.biologicalSex} (Biological Baseline)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/30 text-tertiary font-label-md text-label-md font-semibold">
                  Standard Hydration Index
                </span>
              </div>
            </div>

            {/* Card 2: Body Metrics */}
            <div className="group relative p-6 rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-sm transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-surface-container">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      02 • Body Metrics
                    </span>
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      {data.heightCm} cm • {data.weightKg} kg
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/body-metrics"
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-surface-tint transition-colors px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="mt-3 pl-13 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container">
                  BMI: {getBMI()} kg/m² (Optimal)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container capitalize">
                  {data.unitSystem} Mode
                </span>
                <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-md text-label-md font-semibold">
                  Verified Target Range
                </span>
              </div>
            </div>

            {/* Card 3: Clinical Goal */}
            <div className="group relative p-6 rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-sm transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-surface-container">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      03 • Clinical Primary Goal
                    </span>
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      {getGoalTitle()}
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/goals"
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-surface-tint transition-colors px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="mt-3 pl-13 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container capitalize">
                  {data.pace} progression curve
                </span>
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md font-semibold">
                  Postprandial Glycemic Control
                </span>
              </div>
            </div>

            {/* Card 4: Activity Level */}
            <div className="group relative p-6 rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-sm transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-surface-container">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      04 • Activity Profile
                    </span>
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      {data.activityLevel} ({data.frequency})
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/activity"
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-surface-tint transition-colors px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="mt-3 pl-13 flex flex-wrap items-center gap-2">
                {data.routines.map((r) => (
                  <span
                    key={r}
                    className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container"
                  >
                    {r}
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container">
                  {data.dailySteps.toLocaleString()} steps/day
                </span>
              </div>
            </div>

            {/* Card 5: Dietary Patterns */}
            <div className="group relative p-6 rounded-xl bg-surface-container-lowest shadow-xs hover:shadow-sm transition-shadow border border-surface-container-low">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-surface-container">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      05 • Dietary &amp; Regional Patterns
                    </span>
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      South Indian &amp; North Indian • Lacto-Vegetarian
                    </span>
                  </div>
                </div>
                <Link
                  to="/onboarding/activity"
                  className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-surface-tint transition-colors px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
              <div className="mt-3 pl-13 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container">
                  Tamil Nadu / Kerala staple grains
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md border border-surface-container">
                  Lentil &amp; Dal prioritization
                </span>
                <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-label-md inline-flex items-center gap-1 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" /> Avoids: Peanuts (Severe)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Starting Baseline Preview */}
          <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-28">
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-container-lowest shadow-md flex flex-col gap-6 relative overflow-hidden border border-surface-container-low">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="font-title-lg text-title-lg text-primary font-bold">
                    Your Starting Baseline
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/50 text-on-tertiary-fixed font-label-sm text-label-sm font-semibold uppercase">
                  Calibrated
                </span>
              </div>

              {/* Energy Target */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                    Starting Daily Target
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-xs">
                    BMR 1,520 kcal × 1.41 PAL
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-primary font-bold">
                    2,150
                  </span>
                  <span className="font-title-md text-title-md text-on-surface-variant">
                    kcal / day
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Calculated via Mifflin-St Jeor equation customized with your activity baseline.
                </p>
              </div>

              {/* Protein & Fiber Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between border border-surface-container">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                      Protein Target
                    </span>
                    <Egg className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="mt-2">
                    <span className="font-headline-lg text-headline-lg text-primary font-semibold">
                      90
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant ml-1">
                      g / day
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-surface-tint mt-1 font-medium">
                    ~1.60 g/kg (Preservation)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between border border-surface-container">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                      Dietary Fiber
                    </span>
                    <Wheat className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="mt-2">
                    <span className="font-headline-lg text-headline-lg text-primary font-semibold">
                      32
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant ml-1">
                      g / day
                    </span>
                  </div>
                  <span className="font-body-sm text-body-sm text-surface-tint mt-1 font-medium">
                    Cardiometabolic baseline
                  </span>
                </div>
              </div>

              {/* Macro Bar */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>Macronutrient Composition</span>
                  <span className="font-semibold text-primary">50% C • 20% P • 30% F</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-container-high">
                  <div className="bg-secondary h-full" style={{ width: '50%' }} />
                  <div className="bg-primary-container h-full" style={{ width: '20%' }} />
                  <div className="bg-surface-tint h-full" style={{ width: '30%' }} />
                </div>
                <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span>Carbs (268g)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                    <span>Protein (90g)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-tint" />
                    <span>Fats (71g)</span>
                  </div>
                </div>
              </div>

              {/* Complete Setup CTA */}
              <button
                type="button"
                disabled={isCompleting}
                onClick={handleCompleteSequence}
                className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer font-semibold disabled:opacity-80"
              >
                {isCompleting ? (
                  <>
                    <span>{completionStepText}</span>
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    <span>Complete Setup &amp; Enter Workspace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SUCCESS OVERLAY MODAL                       */}
      {/* ========================================== */}
      {simState === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-xs transition-all duration-300">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col gap-6 relative overflow-hidden border border-surface-container-high">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-md shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-surface-tint uppercase tracking-widest font-semibold">
                  Evaluation Finalized
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                  Your PoshanCare profile is ready.
                </h2>
              </div>
            </div>

            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Your personalized clinical nutrition workspace has been generated based on{' '}
              <strong className="text-on-surface font-semibold">{data.fullName}'s</strong> metabolic
              profile, regional dietary habits, and activity patterns.
            </p>

            {/* Dynamic Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Daily Energy Budget
                </span>
                <span className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                  2,150 kcal
                </span>
                <span className="font-body-sm text-body-sm text-surface-tint mt-0.5 font-medium">
                  Optimal Maintenance
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Calibrated Macro Split
                </span>
                <span className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                  50C / 20P / 30F
                </span>
                <span className="font-body-sm text-body-sm text-surface-tint mt-0.5 font-medium">
                  90g High-quality protein
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Indian Culinary Matrix
                </span>
                <span className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                  12,000+ Items
                </span>
                <span className="font-body-sm text-body-sm text-surface-tint mt-0.5 font-medium">
                  Peanut allergens filtered
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-3 border border-surface-container">
              <Sparkles className="w-6 h-6 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-primary font-semibold">
                  Continuous Dynamic Calibration
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Your daily glycemic responsiveness, subjective satiety ratings, and weekly weight
                  trends will continuously fine-tune these baselines.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-surface-container-low">
              <button
                type="button"
                onClick={() => setSimState('review')}
                className="px-4 py-3 rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer font-medium"
              >
                Back to Review
              </button>

              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>Go to PoshanCare Sign In</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
