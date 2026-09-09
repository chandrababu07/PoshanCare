import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ruler,
  Scale,
  Plus,
  Minus,
  HelpCircle,
  X,
  Droplets,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  useOnboarding,
  UnitSystem,
  CompositionIntent,
  LeanMassFocus,
} from '../../context/OnboardingContext';

export const BodyMetricsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [unitSystem, setUnitSystem] = useState<UnitSystem>(data.unitSystem);
  const [heightCm, setHeightCm] = useState(data.heightCm);
  const [weightKg, setWeightKg] = useState(data.weightKg);

  const [heightFt, setHeightFt] = useState(data.heightFt);
  const [heightIn, setHeightIn] = useState(data.heightIn);
  const [weightLbs, setWeightLbs] = useState(data.weightLbs);

  const [compositionIntent, setCompositionIntent] = useState<CompositionIntent>(
    (data.compositionIntent as CompositionIntent) || 'maintain'
  );
  const [targetMass, setTargetMass] = useState(data.targetMass || 58.0);
  const [leanMassFocus, setLeanMassFocus] = useState<LeanMassFocus>(
    (data.leanMassFocus as LeanMassFocus) || 'moderate'
  );

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync unit changes
  const handleUnitSystemChange = (system: UnitSystem) => {
    setUnitSystem(system);
    if (system === 'imperial') {
      const totalInches = heightCm / 2.54;
      setHeightFt(Math.floor(totalInches / 12));
      setHeightIn(Math.round((totalInches % 12) * 10) / 10);
      setWeightLbs(Math.round(weightKg * 2.20462 * 10) / 10);
    } else {
      const cm = Math.round((heightFt * 12 + heightIn) * 2.54);
      const kg = Math.round((weightLbs / 2.20462) * 10) / 10;
      setHeightCm(cm);
      setWeightKg(kg);
    }
  };

  const handleMetricHeight = (val: number) => {
    const clamped = Math.max(100, Math.min(240, val));
    setHeightCm(clamped);
    const totalInches = clamped / 2.54;
    setHeightFt(Math.floor(totalInches / 12));
    setHeightIn(Math.round((totalInches % 12) * 10) / 10);
  };

  const handleMetricWeight = (val: number) => {
    const clamped = Math.max(30, Math.min(220, val));
    setWeightKg(clamped);
    setWeightLbs(Math.round(clamped * 2.20462 * 10) / 10);
  };

  const handleImperialHeight = (ft: number, inch: number) => {
    setHeightFt(ft);
    setHeightIn(inch);
    const cm = Math.round((ft * 12 + inch) * 2.54);
    setHeightCm(cm);
  };

  const handleImperialWeight = (lbs: number) => {
    setWeightLbs(lbs);
    const kg = Math.round((lbs / 2.20462) * 10) / 10;
    setWeightKg(kg);
  };

  // Calculations for live right-column preview card
  const calcBSA = () => {
    if (heightCm <= 0 || weightKg <= 0) return '1.59';
    const bsa = 0.007184 * Math.pow(heightCm, 0.725) * Math.pow(weightKg, 0.425);
    return bsa.toFixed(2);
  };

  const calcBMI = () => {
    if (heightCm <= 0 || weightKg <= 0) return '21.2';
    const hM = heightCm / 100;
    return (weightKg / (hM * hM)).toFixed(1);
  };

  const calcBMR = () => {
    if (heightCm <= 0 || weightKg <= 0) return '1,310';
    const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * data.age + 5);
    return bmr.toLocaleString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateData(
      {
        unitSystem,
        heightCm,
        weightKg,
        heightFt,
        heightIn,
        weightLbs,
        compositionIntent,
        targetMass,
        leanMassFocus,
        currentStep: 4,
      },
      4
    );

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/activity');
    }, 500);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold tracking-wider uppercase">
                Step 3 of 9
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Height &amp; Weight Metrics
              </span>
            </div>
            <h1 className="font-display-lg text-headline-lg text-primary tracking-tight font-bold mt-1">
              Let's establish your baseline.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl">
              These measurements help PoshanCare calculate your basal metabolic surface area and
              energy balance dynamics without clinical judgment or normative labeling.
            </p>
          </div>

          {/* Unit System Switcher Pill */}
          <div className="flex items-center justify-between bg-surface-container-low p-1.5 rounded-full max-w-sm shadow-xs border border-surface-container">
            <button
              type="button"
              onClick={() => handleUnitSystemChange('metric')}
              className={`flex-1 py-2 px-4 rounded-full font-label-md text-label-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                unitSystem === 'metric'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>Metric (cm / kg)</span>
            </button>

            <button
              type="button"
              onClick={() => handleUnitSystemChange('imperial')}
              className={`flex-1 py-2 px-4 rounded-full font-label-md text-label-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                unitSystem === 'imperial'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Imperial (ft in / lbs)</span>
            </button>
          </div>

          {/* Inputs Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest rounded-xl p-6 shadow-xs flex flex-col gap-6 border border-surface-container-low"
          >
            {/* Height Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  <span>Stature (Height)</span>
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Measured barefoot
                </span>
              </div>

              {unitSystem === 'metric' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={100}
                        max={240}
                        step={0.5}
                        value={heightCm}
                        onChange={(e) => handleMetricHeight(parseFloat(e.target.value) || 160)}
                        className="w-full h-12 px-4 rounded-lg bg-surface font-title-lg text-title-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold border border-surface-container-high"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant font-medium">
                        cm
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-surface-container">
                      <button
                        type="button"
                        onClick={() => handleMetricHeight(heightCm - 1)}
                        className="w-10 h-10 rounded-md bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMetricHeight(heightCm + 1)}
                        className="w-10 h-10 rounded-md bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={120}
                    max={210}
                    step={0.5}
                    value={heightCm}
                    onChange={(e) => handleMetricHeight(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      min={3}
                      max={7}
                      value={heightFt}
                      onChange={(e) =>
                        handleImperialHeight(parseInt(e.target.value, 10) || 0, heightIn)
                      }
                      className="w-full h-12 px-4 rounded-lg bg-surface font-title-lg text-title-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold border border-surface-container-high"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant font-medium">
                      ft
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={11.5}
                      step={0.5}
                      value={heightIn}
                      onChange={(e) =>
                        handleImperialHeight(heightFt, parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-12 px-4 rounded-lg bg-surface font-title-lg text-title-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold border border-surface-container-high"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant font-medium">
                      in
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Weight Section */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-title-md text-title-md text-on-surface flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  <span>Current Body Mass (Weight)</span>
                </label>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Calibrated precision
                </span>
              </div>

              {unitSystem === 'metric' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={30}
                        max={220}
                        step={0.1}
                        value={weightKg}
                        onChange={(e) => handleMetricWeight(parseFloat(e.target.value) || 50)}
                        className="w-full h-12 px-4 rounded-lg bg-surface font-title-lg text-title-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold border border-surface-container-high"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant font-medium">
                        kg
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-surface-container">
                      <button
                        type="button"
                        onClick={() => handleMetricWeight(weightKg - 0.5)}
                        className="w-10 h-10 rounded-md bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMetricWeight(weightKg + 0.5)}
                        className="w-10 h-10 rounded-md bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={35}
                    max={150}
                    step={0.1}
                    value={weightKg}
                    onChange={(e) => handleMetricWeight(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
                  />
                </div>
              ) : (
                <div className="relative w-full">
                  <input
                    type="number"
                    min={65}
                    max={400}
                    step={0.2}
                    value={weightLbs}
                    onChange={(e) => handleImperialWeight(parseFloat(e.target.value) || 120)}
                    className="w-full h-12 px-4 rounded-lg bg-surface font-title-lg text-title-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold border border-surface-container-high"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-label-md text-on-surface-variant font-medium">
                    lbs
                  </span>
                </div>
              )}
            </div>

            {/* Target Body Composition Expander */}
            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-4 border border-surface-container">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Target Body Composition
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Do you have a specific body composition or lean tissue aspiration?
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`relative flex items-center p-3.5 rounded-lg border cursor-pointer transition-all ${
                    compositionIntent === 'standard'
                      ? 'bg-surface-container-lowest border-primary shadow-xs'
                      : 'bg-surface border-surface-container-high hover:bg-surface-container-low'
                  }`}
                >
                  <input
                    type="radio"
                    name="composition_intent"
                    checked={compositionIntent === 'standard'}
                    onChange={() => setCompositionIntent('standard')}
                    className="w-4 h-4 text-primary focus:ring-0 mr-3"
                  />
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-md text-on-surface font-semibold">
                      Maintain / Undecided
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Focus solely on metabolic stability
                    </span>
                  </div>
                </label>

                <label
                  className={`relative flex items-center p-3.5 rounded-lg border cursor-pointer transition-all ${
                    compositionIntent === 'custom'
                      ? 'bg-surface-container-lowest border-primary shadow-xs'
                      : 'bg-surface border-surface-container-high hover:bg-surface-container-low'
                  }`}
                >
                  <input
                    type="radio"
                    name="composition_intent"
                    checked={compositionIntent === 'custom'}
                    onChange={() => setCompositionIntent('custom')}
                    className="w-4 h-4 text-primary focus:ring-0 mr-3"
                  />
                  <div className="flex flex-col">
                    <span className="font-title-sm text-title-md text-on-surface font-semibold">
                      Set Specific Goal
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Target weight or lean muscular mass
                    </span>
                  </div>
                </label>
              </div>

              {compositionIntent === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="target-mass-input"
                      className="font-label-md text-label-md font-medium text-on-surface"
                    >
                      Target Body Mass
                    </label>
                    <div className="relative">
                      <input
                        id="target-mass-input"
                        type="number"
                        step={0.5}
                        value={targetMass}
                        onChange={(e) => setTargetMass(parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 58.0"
                        className="w-full h-11 px-3.5 rounded-lg bg-surface text-on-surface font-title-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container-high"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant">
                        {unitSystem === 'metric' ? 'kg' : 'lbs'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md font-medium text-on-surface">
                      Lean Mass Focus{' '}
                      <span className="text-on-surface-variant text-label-sm">(Optional)</span>
                    </label>
                    <select
                      value={leanMassFocus}
                      onChange={(e) => setLeanMassFocus(e.target.value as LeanMassFocus)}
                      className="w-full h-11 px-3 rounded-lg bg-surface text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container-high"
                    >
                      <option value="none">Standard physiological balance</option>
                      <option value="lean_gain">
                        Hypertrophy / Lean tissue accretion (+2-3kg)
                      </option>
                      <option value="sarcopenia_prevent">
                        Functional preservation (Metabolic bone/muscle)
                      </option>
                      <option value="recomp">
                        Body recomposition (Stable mass, reduced adipose)
                      </option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Methodology Link */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary-container font-label-md text-label-md transition-colors cursor-pointer group"
              >
                <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="underline underline-offset-4 font-semibold">
                  How is this calculated? Clinical Reference Data
                </span>
              </button>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
              <button
                type="button"
                onClick={() => navigate('/onboarding/profile')}
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
                    <span>Saving Metrics...</span>
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

        {/* Right Column: Live Clinical Baseline & Anthropometry Card */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-md flex flex-col gap-4 border border-surface-container-low">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="font-title-md text-title-md text-primary font-bold tracking-tight">
                  Clinical Anthropometry
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                Live Evaluation
              </span>
            </div>

            {/* BSA Display */}
            <div className="bg-surface rounded-xl p-4 flex flex-col gap-2.5 border border-surface-container">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Body Surface Area (DuBois Eq.)
                </span>
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  {calcBSA()} m²
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, (parseFloat(calcBSA()) / 2.5) * 100))}%` }}
                />
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Standardized index for metabolic rate normalization.
              </span>
            </div>

            {/* Primary Metric Readings Mosaic */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col border border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Estimated Resting Burn
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    {calcBMR()}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary">kcal/d</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Mifflin Base
                </span>
              </div>

              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col border border-surface-container">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Anthropometric Ratio
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    {calcBMI()}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-medium">
                    kg/m²
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-primary-container font-semibold mt-1">
                  Neutral Reference Zone
                </span>
              </div>
            </div>

            {/* Dynamic Hydration Graph */}
            <div className="bg-surface rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden border border-surface-container">
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-md text-on-surface font-semibold">
                  Estimated Physiological Volume
                </span>
                <Droplets className="w-4 h-4 text-surface-tint" />
              </div>
              <div className="relative w-full h-20 flex items-end">
                <svg
                  className="w-full h-full text-primary"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="0 0 300 80"
                >
                  <defs>
                    <linearGradient id="curveGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 60 C50 45, 100 20, 150 25 C200 30, 250 50, 300 35 L300 80 L0 80 Z"
                    fill="url(#curveGradient)"
                  />
                  <path
                    d="M0 60 C50 45, 100 20, 150 25 C200 30, 250 50, 300 35"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="150"
                    cy="25"
                    r="4"
                    className="fill-secondary-container stroke-primary"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Intracellular ~21.2L</span>
                <span className="font-semibold text-primary">Hydration Target ~2.4L/d</span>
                <span>Extracellular ~12.8L</span>
              </div>
            </div>

            {/* Non-judgmental Stance Note */}
            <div className="p-3 rounded-lg bg-surface-container-high/50 flex gap-3 items-start border border-surface-container">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-title-sm text-label-lg font-semibold text-primary">
                  Objective Measurement Philosophy
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  PoshanCare views scale weight purely as kinetic mass requiring cellular fuel,
                  never as an aesthetic or moral determinant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex bg-on-surface/40 backdrop-blur-xs items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-xl flex flex-col gap-4 relative border border-surface-container-high">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Calculation Methodology
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface-container-high flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-md text-body-md text-on-surface-variant leading-relaxed">
              <p>
                PoshanCare uses globally recognized, peer-reviewed clinical formulas to translate
                simple measurements into non-judgmental physiological targets:
              </p>

              <div className="bg-surface p-3 rounded-lg flex flex-col gap-1 font-label-sm text-label-sm border border-surface-container">
                <span className="font-bold text-on-surface">
                  1. Body Surface Area (DuBois &amp; DuBois):
                </span>
                <code>BSA (m²) = 0.007184 × Height(cm)^0.725 × Weight(kg)^0.425</code>
              </div>

              <div className="bg-surface p-3 rounded-lg flex flex-col gap-1 font-label-sm text-label-sm border border-surface-container">
                <span className="font-bold text-on-surface">
                  2. Basal Energy Expenditure (Mifflin-St Jeor):
                </span>
                <code>BMR = 10(W) + 6.25(H) - 5(A) + S</code>
              </div>

              <p>
                We deliberately avoid terminology such as "Overweight" or "Ideal" in favor of
                metabolic energy balance ranges tailored to your endocrine health profile.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyMetricsPage;
