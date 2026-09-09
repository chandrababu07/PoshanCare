import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Check,
  Footprints,
  Plus,
  Minus,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useOnboarding, ActivityLevel } from '../../context/OnboardingContext';

export const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(data.activityLevel);
  const [routines, setRoutines] = useState<string[]>(data.routines);
  const [frequency, setFrequency] = useState<string>(data.frequency);
  const [dailySteps, setDailySteps] = useState<number>(data.dailySteps);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activityOptions: {
    level: ActivityLevel;
    pal: string;
    desc: string;
    tdee: number;
    burn: number;
  }[] = [
    {
      level: 'Sedentary',
      pal: '1.20',
      desc: 'Mostly sitting · Little or no structured exercise',
      tdee: 1725,
      burn: 287,
    },
    {
      level: 'Lightly Active',
      pal: '1.375',
      desc: 'Light daily movement · Exercise 1–3 days/week',
      tdee: 1977,
      burn: 539,
    },
    {
      level: 'Moderately Active',
      pal: '1.55',
      desc: 'Regular movement · Exercise 3–5 days/week',
      tdee: 2150,
      burn: 712,
    },
    {
      level: 'Very Active',
      pal: '1.725',
      desc: 'Hard exercise · Exercise 6–7 days/week',
      tdee: 2480,
      burn: 1042,
    },
    {
      level: 'Extremely Active',
      pal: '1.90',
      desc: 'Highly physical lifestyle · Intense training or manual labor',
      tdee: 2732,
      burn: 1294,
    },
  ];

  const currentOption =
    activityOptions.find((o) => o.level === activityLevel) || activityOptions[2];

  const routineList = [
    { tag: 'Strength Training', desc: 'Weights, bodyweight, resistance' },
    { tag: 'Cardio', desc: 'Running, cycling, swimming, rowing' },
    { tag: 'Mixed Training', desc: 'Hybrid strength & metabolic conditioning' },
    { tag: 'Recreational Activity', desc: 'Yoga, tennis, hiking, leisure walking' },
    { tag: 'No Regular Exercise', desc: 'Focusing strictly on dietary modification' },
  ];

  const toggleRoutine = (tag: string) => {
    if (tag === 'No Regular Exercise') {
      setRoutines(['No Regular Exercise']);
      return;
    }

    let updated = routines.filter((r) => r !== 'No Regular Exercise');
    if (updated.includes(tag)) {
      updated = updated.filter((r) => r !== tag);
    } else {
      updated.push(tag);
    }
    setRoutines(updated);
  };

  const handleStepChange = (val: number) => {
    const clamped = Math.max(2000, Math.min(20000, val));
    setDailySteps(clamped);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateData({ activityLevel, routines, frequency, dailySteps }, 4);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/review');
    }, 600);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm text-primary font-semibold tracking-wide uppercase">
            Step 5 of 6
          </span>
          <span className="text-outline-variant">•</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
            Physical Activity Multiplier (PAL) Calibration
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              How active are you?
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
              Tell us about your daily movement and exercise so PoshanCare can accurately estimate
              your physical energy expenditure.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-lowest shadow-xs border border-surface-container shrink-0">
            <Activity className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">
                ICMR-NIN &amp; WHO
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant text-[10px] leading-tight">
                Bioenergetics Validated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Assessment Controls */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Section 1: Activity Level */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                  1
                </span>
                <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
                  Daily Activity Level
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Baseline Metabolic Factor
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {activityOptions.map((opt) => {
                const isSelected = activityLevel === opt.level;
                return (
                  <div
                    key={opt.level}
                    onClick={() => setActivityLevel(opt.level)}
                    className={`cursor-pointer p-4 rounded-xl shadow-xs transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-gradient-to-r from-surface-container-low/80 to-surface-container-lowest border-primary shadow-md'
                        : 'bg-surface-container-lowest border-surface-container-high hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-primary' : 'bg-surface-container-high'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-on-primary" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-title-md text-title-md font-semibold ${
                              isSelected ? 'text-primary' : 'text-on-surface'
                            }`}
                          >
                            {opt.level}
                          </span>
                          {opt.level === 'Moderately Active' && (
                            <span className="px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold text-[10px] uppercase tracking-wider">
                              Standard Calibration
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${
                          isSelected
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        PAL {opt.pal}×
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Exercise Routine Modalities */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                  2
                </span>
                <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
                  What's your usual exercise routine?
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Select all that apply
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {routineList.map((item) => {
                const isSelected = routines.includes(item.tag);
                const isSpan = item.tag === 'No Regular Exercise';

                return (
                  <div
                    key={item.tag}
                    onClick={() => toggleRoutine(item.tag)}
                    className={`${
                      isSpan ? 'sm:col-span-2' : ''
                    } cursor-pointer p-4 rounded-xl shadow-xs transition-all flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-surface-container-low border-primary shadow-xs'
                        : 'bg-surface-container-lowest border-surface-container-high hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <Activity className="w-4.5 h-4.5" />
                      </div>
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          isSelected ? 'text-primary fill-primary/10' : 'text-outline-variant'
                        }`}
                      />
                    </div>
                    <div className="mt-3">
                      <span
                        className={`font-title-md text-title-md font-semibold block leading-tight ${
                          isSelected ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {item.tag}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {item.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Training Frequency */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                  3
                </span>
                <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
                  How often do you exercise?
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Weekly Cadence
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-xl bg-surface-container-high/60 border border-surface-container">
              {['0 days/week', '1–2 days/week', '3–4 days/week', '5–6 days/week', 'Every day'].map(
                (d) => {
                  const isSelected = frequency === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFrequency(d)}
                      className={`py-2.5 px-3 rounded-lg font-label-md text-label-md transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                          : 'text-on-surface hover:bg-surface-container-lowest'
                      }`}
                    >
                      {d.replace('/week', '')}
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* Section 4: Daily Movement Slider & Stepper */}
          <section className="flex flex-col gap-4 p-6 rounded-2xl bg-surface-container-lowest shadow-xs border border-surface-container-low">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                  4
                </span>
                <div>
                  <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
                    Average daily movement
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Your daily movement helps us estimate activity-related energy expenditure.
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary shrink-0">
                <Footprints className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-semibold">
                    Target Cadence
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-display-lg text-display-lg text-primary tracking-tight font-bold">
                      {dailySteps.toLocaleString()}
                    </span>
                    <span className="font-title-md text-title-md text-on-surface-variant">
                      steps / day
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-xl border border-surface-container">
                  <button
                    type="button"
                    onClick={() => handleStepChange(dailySteps - 500)}
                    className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-outline-variant/30" />
                  <button
                    type="button"
                    onClick={() => handleStepChange(dailySteps + 500)}
                    className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min={2000}
                  max={20000}
                  step={500}
                  value={dailySteps}
                  onChange={(e) => handleStepChange(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
                />
                <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>2,000 (Sedentary)</span>
                  <span className="text-primary font-medium">8k (Healthy Base)</span>
                  <span>12,000 (Cardio)</span>
                  <span>20,000+</span>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
            <button
              type="button"
              onClick={() => navigate('/onboarding/goals')}
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
                  <span>Saving Activity...</span>
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

        {/* Right Column: Sticky Live Clinical Activity Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-md flex flex-col gap-6 relative overflow-hidden border border-surface-container-low">
            <div className="flex items-start justify-between border-b pb-4 border-surface-container-low">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Clinical Model
                </span>
                <h3 className="font-title-lg text-title-lg text-primary font-bold">
                  Your Activity Profile
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold tracking-wide">
                Calibrated PAL
              </span>
            </div>

            {/* Key Metrics Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Activity Level
                </span>
                <span className="font-title-md text-title-md text-on-surface font-semibold mt-0.5 truncate">
                  {currentOption.level}
                </span>
                <span className="font-label-sm text-label-sm text-primary font-medium mt-1">
                  PAL {currentOption.pal} multiplier
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex flex-col border border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Frequency
                </span>
                <span className="font-title-md text-title-md text-on-surface font-semibold mt-0.5">
                  {frequency}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Structured schedule
                </span>
              </div>
            </div>

            {/* Routine Tags */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Exercise Routine Modalities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {routines.map((r) => (
                  <span
                    key={r}
                    className="px-2.5 py-1 rounded-lg bg-surface-container-high font-label-sm text-label-sm text-on-surface font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-primary" /> {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Energy Expenditure Breakdown */}
            <div className="p-4 rounded-xl bg-surface-container-low/80 flex flex-col gap-3 border border-surface-container">
              <div className="flex items-baseline justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Estimated Daily TDEE
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-headline-lg text-headline-lg text-primary font-bold">
                      {currentOption.tdee.toLocaleString()}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      kcal / day
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-label-sm text-label-sm text-secondary font-semibold block">
                    +{currentOption.burn} kcal
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                    Active Burn
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <div className="h-3.5 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-primary-container relative"
                    style={{ width: '67%' }}
                  />
                  <div
                    className="h-full bg-secondary-container relative"
                    style={{ width: '33%' }}
                  />
                </div>
                <div className="flex items-center justify-between font-label-sm text-label-sm text-[11px] text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                    <span>BMR: 1,438 kcal (67%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                    <span>Activity: {currentOption.burn} kcal (33%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Wearable Sync Help */}
            <div className="p-3.5 rounded-xl bg-surface-container-low/60 flex items-center justify-between border border-surface-container">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Unsure about your PAL?
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                    Our clinical team can auto-sync with Apple Health or Google Fit.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ActivityPage;
