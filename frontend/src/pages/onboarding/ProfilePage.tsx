import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Cake,
  Activity,
  HeartPulse,
  Info,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  AlertCircle,
  Calculator,
  Lock,
  Loader2,
} from 'lucide-react';
import { useOnboarding, BiologicalSex } from '../../context/OnboardingContext';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [fullName, setFullName] = useState(data.fullName);
  const [age, setAge] = useState(data.age);
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>(data.biologicalSex);

  const [showAccordion, setShowAccordion] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [ageError, setAgeError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCohortText = (numAge: number) => {
    if (numAge < 18) return 'Adolescent (13–18 yrs)';
    if (numAge >= 19 && numAge <= 50) return 'Adult (19–50 yrs)';
    return 'Mature Adult (50+ yrs)';
  };

  // Recompute live BMR
  const computeBMR = () => {
    let baseBmr = 1400;
    let protein = '94g';
    let carbs = '160g';
    let fats = '42g';

    if (biologicalSex === 'female') {
      baseBmr = Math.round(1350 - age * 3.2);
      protein = '94g';
      carbs = '160g';
      fats = '42g';
    } else if (biologicalSex === 'male') {
      baseBmr = Math.round(1680 - age * 4.1);
      protein = '118g';
      carbs = '190g';
      fats = '52g';
    } else {
      baseBmr = Math.round(1510 - age * 3.6);
      protein = '105g';
      carbs = '175g';
      fats = '47g';
    }

    return { bmr: baseBmr.toLocaleString(), protein, carbs, fats };
  };

  const bmrStats = computeBMR();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!fullName.trim()) {
      setNameError(true);
      hasError = true;
    } else {
      setNameError(false);
    }

    if (!age || age < 1 || age > 120) {
      setAgeError(true);
      hasError = true;
    } else {
      setAgeError(false);
    }

    if (hasError) return;

    setIsSubmitting(true);
    updateData({ fullName, age, biologicalSex }, 1);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/body-metrics');
    }, 600);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Intake */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm tracking-wide uppercase font-semibold">
                Step 2 of 6
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-surface-tint" /> Baseline Profile Initialization
              </span>
            </div>
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-bold mt-1">
              Tell us about yourself.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              We use these details to calibrate biological basal metrics and personalize your
              metabolic nutrition framework.
            </p>
          </div>

          {/* Inline Clinical Progress Bar */}
          <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2 shadow-xs border border-surface-container">
            <div className="flex items-center justify-between font-label-md text-label-md">
              <span className="text-primary font-semibold flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-primary" /> Metabolic Intake Calibration
              </span>
              <span className="text-primary font-semibold">33% Completed</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
              <div className="h-full w-1/3 bg-primary transition-all duration-500 ease-out rounded-full" />
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Next: Stature, Mass &amp; Anthropometry
            </span>
          </div>

          {/* Primary Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 bg-surface-container-lowest p-6 sm:p-8 rounded-xl shadow-xs border border-surface-container-low"
          >
            {/* Field 1: Full Name */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="fullName"
                  className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-1.5"
                >
                  Full Name <span className="text-error font-body-sm">*</span>
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Legal or preferred clinical record
                </span>
              </div>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-outline w-5 h-5 pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  placeholder="e.g., Dr. Ananya Iyer or Priya Patel"
                  className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-container transition-all placeholder:text-outline/70 focus:bg-surface-container-low"
                />
              </div>
              {nameError && (
                <p className="font-body-sm text-body-sm text-error flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" /> Please enter your full name.
                </p>
              )}
            </div>

            {/* Field 2: Age */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ageInput"
                  className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-1.5"
                >
                  Age <span className="text-error font-body-sm">*</span>
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Used for endocrine decay &amp; enzyme formulas
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-7 relative flex items-center">
                  <Cake className="absolute left-3.5 text-outline w-5 h-5 pointer-events-none" />
                  <input
                    id="ageInput"
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={age}
                    onChange={(e) => {
                      setAge(parseInt(e.target.value, 10) || 0);
                      if (ageError) setAgeError(false);
                    }}
                    className="w-full h-12 pl-11 pr-16 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-container transition-all focus:bg-surface-container-low"
                  />
                  <span className="absolute right-3.5 px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-on-surface font-semibold uppercase">
                    Years
                  </span>
                </div>
                <div className="sm:col-span-5 flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
                  <Activity className="w-4.5 h-4.5 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                      Cohort Band
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {getCohortText(age)}
                    </span>
                  </div>
                </div>
              </div>
              {ageError && (
                <p className="font-body-sm text-body-sm text-error flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" /> Please enter a valid age between 1 and 120.
                </p>
              )}
            </div>

            {/* Field 3: Biological Sex Selection */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-1.5">
                  Biological Sex <span className="text-error font-body-sm">*</span>
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  At birth / karyotypic profile
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Female Card */}
                <button
                  type="button"
                  onClick={() => setBiologicalSex('female')}
                  className={`relative flex flex-col items-start p-4 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                    biologicalSex === 'female'
                      ? 'bg-primary text-on-primary shadow-md border-primary'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border-surface-container'
                  } border`}
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        biologicalSex === 'female'
                          ? 'bg-surface-container-lowest/20 text-on-primary'
                          : 'bg-surface-container-lowest text-primary'
                      }`}
                    >
                      <span className="font-bold text-sm">XX</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        biologicalSex === 'female'
                          ? 'bg-surface-container-lowest'
                          : 'bg-outline-variant/60'
                      }`}
                    >
                      {biologicalSex === 'female' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <span className="font-title-md text-title-md font-semibold">Female</span>
                  <span
                    className={`font-label-sm text-label-sm mt-0.5 ${
                      biologicalSex === 'female' ? 'text-on-primary/80' : 'text-on-surface-variant'
                    }`}
                  >
                    XX Chromosomal baseline
                  </span>
                </button>

                {/* Male Card */}
                <button
                  type="button"
                  onClick={() => setBiologicalSex('male')}
                  className={`relative flex flex-col items-start p-4 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                    biologicalSex === 'male'
                      ? 'bg-primary text-on-primary shadow-md border-primary'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border-surface-container'
                  } border`}
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        biologicalSex === 'male'
                          ? 'bg-surface-container-lowest/20 text-on-primary'
                          : 'bg-surface-container-lowest text-primary'
                      }`}
                    >
                      <span className="font-bold text-sm">XY</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        biologicalSex === 'male'
                          ? 'bg-surface-container-lowest'
                          : 'bg-outline-variant/60'
                      }`}
                    >
                      {biologicalSex === 'male' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <span className="font-title-md text-title-md font-semibold">Male</span>
                  <span
                    className={`font-label-sm text-label-sm mt-0.5 ${
                      biologicalSex === 'male' ? 'text-on-primary/80' : 'text-on-surface-variant'
                    }`}
                  >
                    XY Chromosomal baseline
                  </span>
                </button>

                {/* Prefer Not to Say Card */}
                <button
                  type="button"
                  onClick={() => setBiologicalSex('unspecified')}
                  className={`relative flex flex-col items-start p-4 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                    biologicalSex === 'unspecified'
                      ? 'bg-primary text-on-primary shadow-md border-primary'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border-surface-container'
                  } border`}
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        biologicalSex === 'unspecified'
                          ? 'bg-surface-container-lowest/20 text-on-primary'
                          : 'bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        biologicalSex === 'unspecified'
                          ? 'bg-surface-container-lowest'
                          : 'bg-outline-variant/60'
                      }`}
                    >
                      {biologicalSex === 'unspecified' && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <span className="font-title-md text-title-md font-semibold">
                    Prefer not to say
                  </span>
                  <span
                    className={`font-label-sm text-label-sm mt-0.5 ${
                      biologicalSex === 'unspecified'
                        ? 'text-on-primary/80'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    Applies gender-neutral formula
                  </span>
                </button>
              </div>
            </div>

            {/* Clinical Explainer Accordion Box */}
            <div className="rounded-xl bg-surface-container-low p-4 flex flex-col gap-2 border border-surface-container">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 text-on-surface">
                  <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                    Clinical metabolic equations (such as{' '}
                    <strong className="text-primary font-semibold">Mifflin-St Jeor</strong> or{' '}
                    <strong className="text-primary font-semibold">Harris-Benedict</strong>) use
                    biological sex to estimate resting basal metabolic rate (BMR) and lean mass
                    tissue ratio.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAccordion(!showAccordion)}
                    className="self-start inline-flex items-center gap-1 font-label-md text-label-md text-primary font-semibold hover:text-surface-tint transition-colors mt-1 cursor-pointer"
                  >
                    <span>Why do we ask this?</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showAccordion ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {showAccordion && (
                <div className="pl-7 pr-2 pt-2 text-on-surface-variant border-t border-surface-container-high/60 mt-1 flex flex-col gap-2">
                  <p className="font-body-sm text-body-sm leading-relaxed">
                    PoshanCare fully honors and affirms individual gender identity. However, lean
                    tissue mass, respiratory quotient values, and hormonal baseline variances
                    correlate with biological chromosomes in clinical predictive models.
                  </p>
                  <div className="flex items-center gap-2 p-2 rounded bg-surface-container-lowest text-primary border border-surface-container">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="font-label-sm text-label-sm">
                      Selecting "Prefer not to say" applies an averaged non-binary thermodynamic
                      quotient without skewing vital micro-nutrient targets.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
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
                    <span>Saving Profile...</span>
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
          </form>
        </div>

        {/* Right Column: Live Physiological Model & BMR Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Calculated Biological BMR Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-surface-container-low flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-surface-container-low text-primary">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                    Calculated Biological BMR
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Mifflin-St Jeor Estimation
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                Live Preview
              </span>
            </div>

            {/* Concentric Circle BMR Graphics */}
            <div className="relative flex items-center justify-center p-6 bg-surface-container-low rounded-xl border border-surface-container">
              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 120 120">
                <circle
                  className="text-surface-container-high"
                  cx="60"
                  cy="60"
                  fill="transparent"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary transition-all duration-700"
                  cx="60"
                  cy="60"
                  fill="transparent"
                  r="48"
                  stroke="currentColor"
                  strokeDasharray="301.6"
                  strokeDashoffset="190"
                  strokeLinecap="round"
                  strokeWidth="8"
                />
                <circle
                  className="text-surface-container-high"
                  cx="60"
                  cy="60"
                  fill="transparent"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                />
                <circle
                  className="text-secondary-container transition-all duration-700"
                  cx="60"
                  cy="60"
                  fill="transparent"
                  r="36"
                  stroke="currentColor"
                  strokeDasharray="226.2"
                  strokeDashoffset="110"
                  strokeLinecap="round"
                  strokeWidth="6"
                />
                <circle
                  className="text-surface-container-high"
                  cx="60"
                  cy="60"
                  fill="transparent"
                  r="25"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className="text-surface-tint transition-all duration-700"
                  cx="60"
                  cy="60"
                  fill="transparent"
                  r="25"
                  stroke="currentColor"
                  strokeDasharray="157"
                  strokeDashoffset="65"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-headline-lg text-headline-lg text-primary font-bold">
                  {bmrStats.bmr}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  kcal / day (Resting)
                </span>
              </div>
            </div>

            {/* Macro Partition Legend */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded bg-surface-container-low flex flex-col items-center border border-surface-container">
                <span className="w-2.5 h-2.5 rounded-full bg-primary mb-1" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Proteins</span>
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  {bmrStats.protein}
                </span>
              </div>
              <div className="p-2 rounded bg-surface-container-low flex flex-col items-center border border-surface-container">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container mb-1" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Carbs</span>
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  {bmrStats.carbs}
                </span>
              </div>
              <div className="p-2 rounded bg-surface-container-low flex flex-col items-center border border-surface-container">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-tint mb-1" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Lipids</span>
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  {bmrStats.fats}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Assurance Card */}
          <div className="p-4 rounded-xl bg-surface-container-high/40 flex items-center gap-3 border border-surface-container">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Zero Advertising Data Policy
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Your biological sex, age, and metabolic data are never monetized or shared with
                third parties.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
