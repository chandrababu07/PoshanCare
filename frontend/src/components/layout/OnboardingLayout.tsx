import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, User, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { OnboardingProvider } from '../../context/OnboardingContext';

export const OnboardingLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const steps = [
    { title: 'Welcome', path: '/onboarding', step: 1 },
    { title: 'Profile', path: '/onboarding/profile', step: 2 },
    { title: 'Metrics', path: '/onboarding/body-metrics', step: 3 },
    { title: 'Activity', path: '/onboarding/activity', step: 4 },
    { title: 'Goals', path: '/onboarding/goals', step: 5 },
    { title: 'Diet', path: '/onboarding/diet-preferences', step: 6 },
    { title: 'Meals', path: '/onboarding/meal-habits', step: 7 },
    { title: 'Health', path: '/onboarding/health-context', step: 8 },
    { title: 'Review', path: '/onboarding/review', step: 9 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.path === location.pathname);
  const currentStepObj = currentStepIndex !== -1 ? steps[currentStepIndex] : steps[0];
  const currentStep = currentStepObj.step;

  const handleBack = () => {
    if (currentStepIndex > 0) {
      navigate(steps[currentStepIndex - 1].path);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      navigate(steps[currentStepIndex + 1].path);
    }
  };

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-surface flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed font-body-md text-body-md text-on-surface">
        {/* Fixed Top Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-20 max-w-[1280px] mx-auto px-6 lg:px-12 flex items-center justify-between">
            {/* Brand Logo & Title */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-xs">
                <Sparkles className="w-5 h-5 text-primary-fixed" />
              </div>
              <div className="flex flex-col">
                <span className="font-title-lg text-title-lg text-primary tracking-tight font-semibold">
                  PoshanCare
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium tracking-wide uppercase">
                  Personalized Nutrition Intelligence
                </span>
              </div>
            </Link>

            {/* Progress bar */}
            <div className="hidden md:flex flex-col items-center gap-1.5 w-72">
              <div className="flex items-center justify-between w-full">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Personalization
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Step {currentStep} of 9
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden flex gap-1">
                {steps.map((s) => (
                  <div
                    key={s.step}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      s.step <= currentStep ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Header Action Items */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-primary">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="font-label-sm text-label-sm font-semibold tracking-normal text-primary">
                  Privacy Protected
                </span>
              </div>
              <Link
                to="/signin"
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors font-medium"
              >
                Save &amp; continue later
              </Link>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full pt-20 bg-surface flex flex-col justify-between">
          <Outlet />
        </main>

        {/* Clinical Bottom Nav Footer */}
        <footer className="w-full bg-surface-container-lowest shadow-[0_-1px_8px_rgba(0,0,0,0.03)] py-4 mt-auto border-t border-surface-container-low">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <span className="font-label-sm text-label-sm tracking-wide">
                Encrypted &amp; Private • PoshanCare Personalized Nutrition Standard
              </span>
            </div>

            <div className="flex items-center gap-3">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-lg font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              {currentStepIndex < steps.length - 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg hover:bg-primary transition-colors flex items-center gap-1.5 shadow-xs font-semibold cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </OnboardingProvider>
  );
};

export default OnboardingLayout;
