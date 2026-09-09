import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Scale,
  Leaf,
  Activity,
  CheckCircle2,
  Check,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
} from 'lucide-react';
import { useOnboarding, PrimaryGoal, ProgressionPace } from '../../context/OnboardingContext';

export const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(data.primaryGoal);
  const [pace, setPace] = useState<ProgressionPace>(data.pace);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goalOptions = [
    {
      id: 'muscle' as PrimaryGoal,
      title: 'Build Muscle',
      desc: 'Support gradual lean mass synthesis with an optimized nutrient surplus and targeted leucine-threshold distribution.',
      badge: 'High Nitrogen Density',
      icon: Dumbbell,
      traitIcon: TrendingUp,
    },
    {
      id: 'maintain' as PrimaryGoal,
      title: 'Maintain Weight',
      desc: 'Maintain your current homeostatic weight while fine-tuning micronutrient density, mitochondrial health, and energy stability.',
      badge: 'Equilibrium Dynamic',
      icon: Scale,
      traitIcon: CheckCircle2,
    },
    {
      id: 'improve' as PrimaryGoal,
      title: 'Improve Nutrition',
      desc: 'Build more consistent, mindful, and evidence-informed dietary patterns with zero emphasis on scale fluctuations.',
      badge: 'Habit Architecture',
      icon: Leaf,
      traitIcon: Sparkles,
    },
    {
      id: 'fat-loss' as PrimaryGoal,
      title: 'Lose Fat',
      desc: 'Work toward gradual, sustainable adipose reduction while rigorously safeguarding muscle tissue and hormonal baseline.',
      badge: 'Metabolic Protection',
      icon: Activity,
      traitIcon: Shield,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateData({ primaryGoal, pace }, 3);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/activity');
    }, 600);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold tracking-wider uppercase">
              Step 4 of 6
            </span>
            <span className="text-on-surface-variant font-label-sm text-label-sm tracking-wide">
              • Clinical Trajectory
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-bold">
            What are you working toward?
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Choose the primary health vector that aligns with your current metabolic blueprint. You
            can adapt these protocols anytime in your clinical workspace.
          </p>
        </div>

        <div className="flex flex-col gap-1 w-full md:w-64 bg-surface-container-low p-3 rounded-xl shadow-xs border border-surface-container">
          <div className="flex justify-between items-center">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Evaluation Status
            </span>
            <span className="font-label-sm text-label-sm text-primary font-semibold">
              66% Completed
            </span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary-container rounded-full w-2/3 transition-all duration-500" />
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Calibrating thermodynamic &amp; micronutrient distribution
          </span>
        </div>
      </div>

      {/* 4 Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {goalOptions.map((goal) => {
          const IconComponent = goal.icon;
          const TraitIcon = goal.traitIcon;
          const isSelected = primaryGoal === goal.id;

          return (
            <div
              key={goal.id}
              onClick={() => setPrimaryGoal(goal.id)}
              className={`group relative rounded-xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between border ${
                isSelected
                  ? 'bg-surface-container-lowest border-primary shadow-md'
                  : 'bg-surface-container-lowest border-surface-container-high hover:border-primary/50 shadow-xs hover:shadow-sm'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 -mt-2.5 mr-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold shadow-xs">
                    Selected Goal
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-primary group-hover:bg-primary-fixed group-hover:text-on-primary-fixed'
                    }`}
                  >
                    <IconComponent className="w-6.5 h-6.5" />
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h3
                    className={`font-title-lg text-title-lg font-semibold ${
                      isSelected ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {goal.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {goal.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-3 flex items-center justify-between text-on-surface-variant border-t border-surface-container-low">
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">
                  {goal.badge}
                </span>
                <TraitIcon className="w-4.5 h-4.5 text-surface-tint" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progression Pace & Projected Macro Card */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pace Selector */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6 border border-surface-container-low">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                How quickly would you like to progress?
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Clinical protocols are calibrated to physiological adaptation thresholds rather than
              rapid artificial stressors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gradual Pace */}
            <div
              onClick={() => setPace('gradual')}
              className={`relative p-6 rounded-xl cursor-pointer transition-all flex flex-col gap-3 border ${
                pace === 'gradual'
                  ? 'bg-surface-container-low border-primary shadow-xs'
                  : 'bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="px-2 py-0.5 w-fit rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                    Recommended
                  </span>
                  <span className="font-title-lg text-title-lg text-primary font-semibold">
                    Gradual Adaptation
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    pace === 'gradual' ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
                >
                  {pace === 'gradual' && (
                    <div className="w-2 h-2 rounded-full bg-surface-container-lowest" />
                  )}
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Optimal for metabolic preservation, baseline hormone balance, and prolonged
                behavioral adherence (~0.25 kg/week shift).
              </p>

              <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-semibold mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lowest metabolic adaptation risk</span>
              </div>
            </div>

            {/* Moderate Pace */}
            <div
              onClick={() => setPace('moderate')}
              className={`relative p-6 rounded-xl cursor-pointer transition-all flex flex-col gap-3 border ${
                pace === 'moderate'
                  ? 'bg-surface-container-low border-primary shadow-xs'
                  : 'bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="px-2 py-0.5 w-fit rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                    Standard Clinical
                  </span>
                  <span className="font-title-lg text-title-lg text-on-surface font-semibold">
                    Moderate Pace
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    pace === 'moderate' ? 'bg-primary' : 'bg-surface-container-high'
                  }`}
                >
                  {pace === 'moderate' && (
                    <div className="w-2 h-2 rounded-full bg-surface-container-lowest" />
                  )}
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Recommended for individuals with stable hormonal balance and robust recovery
                biomarkers (~0.50 kg/week shift).
              </p>

              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm font-semibold mt-1">
                <Clock className="w-4 h-4" />
                <span>Requires weekly biomarker check-ins</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-4 flex items-start gap-3 border border-surface-container">
            <FileText className="w-5.5 h-5.5 text-secondary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                Clinical Safety Mandate
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                PoshanCare actively rejects extreme, aggressive caloric deficits. Our clinical
                algorithms prioritize thyroid endocrine signaling, lean muscle mass maintenance,
                and consistent nervous system regulation over unsustainable short-term weight
                drops.
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
            <button
              type="button"
              onClick={() => navigate('/onboarding/body-metrics')}
              className="px-6 py-3 rounded-lg font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-2 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-all flex items-center gap-2 shadow-xs font-semibold cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span>Saving Trajectory...</span>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <>
                  <span>Save &amp; Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Projected Macro Ratio */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col gap-4 border border-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface font-semibold">
                Projected Macro Ratio
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Homeostasis Model
              </span>
            </div>

            <div className="flex items-center justify-center py-2 relative">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="48"
                  stroke="#e7eeff"
                  strokeWidth="12"
                />
                <circle
                  className="transition-all duration-700"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="48"
                  stroke="#1b4d3e"
                  strokeDasharray="301.59"
                  strokeDashoffset="180"
                  strokeWidth="12"
                />
                <circle
                  className="transition-all duration-700"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="48"
                  stroke="#7e5700"
                  strokeDasharray="301.59"
                  strokeDashoffset="240"
                  strokeWidth="12"
                />
                <circle
                  className="transition-all duration-700"
                  cx="60"
                  cy="60"
                  fill="none"
                  r="48"
                  stroke="#003625"
                  strokeDasharray="301.59"
                  strokeDashoffset="275"
                  strokeWidth="12"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  2,150
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  kcal / day
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-body-sm">
              <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                  <span className="text-on-surface">Protein (130g)</span>
                </div>
                <span className="font-semibold text-primary">25%</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="text-on-surface">Complex Carbs (240g)</span>
                </div>
                <span className="font-semibold text-primary">45%</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                  <span className="text-on-surface">Lipids &amp; EFAs (72g)</span>
                </div>
                <span className="font-semibold text-primary">30%</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default GoalsPage;
