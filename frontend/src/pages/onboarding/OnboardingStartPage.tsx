import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  HeartPulse,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Utensils,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Activity,
  Loader2,
  Check,
} from 'lucide-react';

export const OnboardingStartPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'default' | 'loading'>('default');

  const handleProceed = () => {
    setViewMode('loading');
    setTimeout(() => {
      navigate('/onboarding/profile');
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[540px] bg-gradient-to-tr from-primary-fixed/25 via-surface-container-high/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-secondary-fixed/15 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Interactive Demo State Switcher */}
          <div className="w-full flex items-center justify-between pb-4 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest shadow-xs border border-surface-container-low">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium uppercase tracking-wider">
                Protocol V3.2 • Onboarding Flow
              </span>
            </div>
            <div className="inline-flex items-center p-1 bg-surface-container rounded-lg shadow-xs gap-1 border border-surface-container-high">
              <button
                type="button"
                onClick={() => setViewMode('default')}
                className={`px-3 py-1 rounded font-label-sm text-label-sm transition-all ${
                  viewMode === 'default'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Default View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('loading')}
                className={`px-3 py-1 rounded font-label-sm text-label-sm transition-all ${
                  viewMode === 'loading'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Transition State
              </button>
            </div>
          </div>

          {/* ========================================== */}
          {/* DEFAULT VIEW CARD                           */}
          {/* ========================================== */}
          {viewMode === 'default' && (
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-6 md:p-12 transition-all duration-300 border border-surface-container-low">
              {/* Top Narrative & Clinical Graphic */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-8 border-b border-surface-container-low">
                {/* Narrative Lead */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low w-fit text-primary border border-surface-container">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-label-md text-label-md font-semibold">
                      Evidence-Based Clinical Intake
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                    Let's personalize your PoshanCare experience.
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                    Tell us a little about yourself so PoshanCare can tailor nutrition targets and
                    insights around your goals.
                  </p>
                  <div className="flex items-center gap-4 pt-1 text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4.5 h-4.5 text-primary" />
                      <span className="font-label-md text-label-md font-medium">3–4 min setup</span>
                    </div>
                    <span className="text-outline-variant">•</span>
                    <div className="flex items-center gap-1.5">
                      <HeartPulse className="w-4.5 h-4.5 text-primary" />
                      <span className="font-label-md text-label-md font-medium">
                        Clinically validated metrics
                      </span>
                    </div>
                  </div>
                </div>

                {/* Biological Illustration / Orbit Diagram */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-full max-w-[320px] aspect-square rounded-xl bg-surface-container-low p-4 flex flex-col justify-between overflow-hidden shadow-inner border border-surface-container">
                    <div className="flex items-center justify-between z-10">
                      <span className="font-label-sm text-label-sm text-primary font-semibold uppercase tracking-wider bg-surface-container-lowest/80 px-2 py-0.5 rounded backdrop-blur-xs">
                        Metabolic Profile
                      </span>
                      <span className="flex items-center gap-1 text-primary text-label-sm font-label-sm font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> calibrated
                      </span>
                    </div>

                    {/* SVG Vector Rings */}
                    <div className="relative flex items-center justify-center my-auto">
                      <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          className="text-surface-container-highest"
                          cx="60"
                          cy="60"
                          fill="none"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="5"
                        />
                        <circle
                          className="text-surface-container-highest"
                          cx="60"
                          cy="60"
                          fill="none"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="5"
                        />
                        <circle
                          className="text-surface-container-highest"
                          cx="60"
                          cy="60"
                          fill="none"
                          r="30"
                          stroke="currentColor"
                          strokeWidth="5"
                        />
                        <circle
                          className="text-primary-container transition-all duration-1000"
                          cx="60"
                          cy="60"
                          fill="none"
                          r="50"
                          stroke="currentColor"
                          strokeDasharray="314"
                          strokeDashoffset="94"
                          strokeLinecap="round"
                          strokeWidth="5"
                        />
                        <circle
                          className="text-secondary transition-all duration-1000"
                          cx="60"
                          cy="60"
                          fill="none"
                          r="40"
                          stroke="currentColor"
                          strokeDasharray="251"
                          strokeDashoffset="85"
                          strokeLinecap="round"
                          strokeWidth="5"
                        />
                        <circle
                          className="text-surface-tint transition-all duration-1000"
                          cx="60"
                          cy="60"
                          fill="none"
                          r="30"
                          stroke="currentColor"
                          strokeDasharray="188"
                          strokeDashoffset="50"
                          strokeLinecap="round"
                          strokeWidth="5"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <Activity className="w-5 h-5 text-primary" />
                        <span className="font-headline-sm text-headline-sm text-primary font-bold leading-none mt-1">
                          94.8%
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Precision
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 z-10 pt-2">
                      <div className="bg-surface-container-lowest rounded p-1.5 text-center">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          Proteins
                        </p>
                        <p className="font-title-md text-title-md text-primary font-bold">
                          1.4g<span className="text-[10px] font-normal text-on-surface-variant">/kg</span>
                        </p>
                      </div>
                      <div className="bg-surface-container-lowest rounded p-1.5 text-center">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          Fiber
                        </p>
                        <p className="font-title-md text-title-md text-secondary font-bold">
                          38g<span className="text-[10px] font-normal text-on-surface-variant">/d</span>
                        </p>
                      </div>
                      <div className="bg-surface-container-lowest rounded p-1.5 text-center">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          GI Wave
                        </p>
                        <p className="font-title-md text-title-md text-surface-tint font-bold">
                          Low
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
                {/* Card 1 */}
                <div className="bg-surface-container-low hover:bg-surface-container transition-all duration-200 rounded-xl p-6 flex flex-col justify-between group border border-surface-container">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-xs">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-title-lg text-title-lg text-primary font-semibold mb-1">
                        Personalized Targets
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Nutrition recommendations based on your profile, metabolic equations, and
                        personal goals.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-primary">
                    <span className="font-label-sm text-label-sm font-semibold">
                      Mifflin-St Jeor &amp; ICMR formulas
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-surface-container-low hover:bg-surface-container transition-all duration-200 rounded-xl p-6 flex flex-col justify-between group relative overflow-hidden border border-surface-container">
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                    Regional DB
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-secondary group-hover:scale-105 transition-transform shadow-xs">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-title-lg text-title-lg text-primary font-semibold mb-1">
                        Indian Food Intelligence
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Nutrition information designed around 12,000+ familiar regional Indian
                        foods, thali combinations, and authentic serving sizes.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-secondary">
                    <span className="font-label-sm text-label-sm font-semibold">
                      Katori, Roti &amp; Millet Granularity
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-surface-container-low hover:bg-surface-container transition-all duration-200 rounded-xl p-6 flex flex-col justify-between group border border-surface-container">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary-container group-hover:scale-105 transition-transform shadow-xs">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-title-lg text-title-lg text-primary font-semibold mb-1">
                        Progress Insights
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Understand longitudinal changes in your nutrition, glycemic responses, and
                        body-weight trends over time.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 flex items-center gap-1 text-primary">
                    <span className="font-label-sm text-label-sm font-semibold">
                      Longitudinal Biomarkers
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Privacy Banner */}
              <div className="my-4 p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center gap-3 border border-surface-container">
                <div className="w-10 h-10 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    <span className="font-semibold text-on-surface">
                      Your information is protected
                    </span>{' '}
                    and strictly used to personalize your experience. You can review your clinical
                    preferences anytime.
                  </p>
                </div>
                <Link
                  to="/privacy"
                  className="font-label-sm text-label-sm font-semibold text-primary hover:underline whitespace-nowrap"
                >
                  Privacy Charter
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleProceed}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary-container text-on-primary font-title-md text-title-md hover:bg-primary transition-all duration-200 flex items-center justify-center gap-2 shadow-xs group cursor-pointer font-semibold"
                >
                  <span>Let's Get Started</span>
                  <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <Link
                  to="/onboarding/profile"
                  className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-surface-container-low"
                >
                  Skip for Now
                </Link>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TRANSITION / LOADING VIEW                   */}
          {/* ========================================== */}
          {viewMode === 'loading' && (
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs p-12 flex flex-col items-center justify-center text-center min-h-[520px] border border-surface-container-low">
              <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                <Loader2 className="w-20 h-20 text-primary-container animate-spin" />
                <Utensils className="w-8 h-8 text-primary absolute animate-pulse" />
              </div>
              <h2 className="font-headline-md text-headline-md text-primary font-bold mb-2">
                Preparing your profile setup...
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto mb-8">
                Configuring baseline metabolism algorithms, regional ICMR nutrient values, and
                clinical safety gates.
              </p>

              <div className="w-full max-w-sm flex flex-col gap-2.5 text-left mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low border border-surface-container">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-label-md text-label-md text-on-surface font-medium">
                    Connecting to Indian Food Composition Database
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low border border-surface-container">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-label-md text-label-md text-on-surface font-medium">
                    Initializing clinical dietary protocols
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-high/60 animate-pulse border border-surface-container-high">
                  <Loader2 className="w-4 h-4 text-surface-tint shrink-0 animate-spin" />
                  <span className="font-label-md text-label-md text-primary font-medium">
                    Tailoring metabolic calculator modules
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('default')}
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors underline pt-2 cursor-pointer"
              >
                Cancel and return to summary
              </button>
            </div>
          )}

          {/* Quick Footnote Meta Pill */}
          <div className="mt-8 max-w-4xl mx-auto flex items-center justify-center gap-6 text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-surface-tint" />
              <span className="font-label-sm text-label-sm">NIN &amp; IFCT Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-surface-tint" />
              <span className="font-label-sm text-label-sm">Session auto-saved</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-surface-tint" />
              <span className="font-label-sm text-label-sm">
                Validated by Certified Dietitians
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStartPage;
