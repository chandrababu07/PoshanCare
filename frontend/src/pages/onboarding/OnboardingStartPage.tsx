import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  HeartPulse,
  Users,
  User,
  Baby,
  Smile,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useOnboarding, ProfileType } from '../../context/OnboardingContext';

export const OnboardingStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [selectedType, setSelectedType] = useState<ProfileType>(data.profileType || 'adult');

  const handleSelectType = (type: ProfileType) => {
    setSelectedType(type);
    updateData({ profileType: type });
  };

  const handleContinue = () => {
    updateData({ profileType: selectedType, currentStep: 2 }, 2);
    navigate('/onboarding/profile');
  };

  const personaOptions: { type: ProfileType; title: string; subtitle: string; icon: React.ReactNode; badge?: string }[] = [
    {
      type: 'adult',
      title: 'Adult',
      subtitle: 'For myself (18–64 years). Balanced macro targets, fitness & daily energy tracking.',
      icon: <User className="w-6 h-6 text-primary" />,
      badge: 'Most Popular',
    },
    {
      type: 'teen',
      title: 'Teenager',
      subtitle: 'For ages 13–17. Growth support, sports nutrition & active lifestyle goals.',
      icon: <Smile className="w-6 h-6 text-secondary" />,
    },
    {
      type: 'child',
      title: 'Child',
      subtitle: 'For ages 1–12. Growth metrics, essential vitamins & parent/guardian management.',
      icon: <Baby className="w-6 h-6 text-primary-container" />,
    },
    {
      type: 'older_adult',
      title: 'Older Adult',
      subtitle: 'For ages 65+. Sarcopenia prevention, joint health & easy-to-read interface.',
      icon: <HeartPulse className="w-6 h-6 text-tertiary" />,
    },
    {
      type: 'family',
      title: 'Family',
      subtitle: 'Managing shared household meals, thali proportions & multi-member wellness.',
      icon: <Users className="w-6 h-6 text-primary-fixed-dim" />,
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12">
        {/* Ambient background decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-primary-fixed/20 via-surface-container-low/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          {/* Hero Welcome Unit */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-10 shadow-xs border border-surface-container-low">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low w-fit text-primary border border-surface-container">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-label-md text-label-md font-semibold">
                  Personalized Nutrition Experience
                </span>
              </div>
              
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                Let's personalize PoshanCare for you.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-2xl">
                A few quick questions will help us understand your nutrition needs and create recommendations tailored specifically for you or your family.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-primary" />
                  <span className="font-label-md text-label-md font-medium">Quick 2–3 min setup</span>
                </div>
                <span className="text-outline-variant hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                  <span className="font-label-md text-label-md font-medium">100% Private &amp; Secure</span>
                </div>
              </div>
            </div>

            {/* STEP 2: WHO IS THIS FOR? */}
            <div className="mt-10 pt-8 border-t border-surface-container-low space-y-6">
              <div>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Who are you setting up PoshanCare for?
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Select a profile category so we can adapt typography, metrics, and nutritional guidance.
                </p>
              </div>

              {/* Persona Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personaOptions.map((option) => {
                  const isSelected = selectedType === option.type;
                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => handleSelectType(option.type)}
                      className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary-container/10 shadow-sm'
                          : 'border-surface-container-high bg-surface-container-low hover:border-primary/40 hover:bg-surface-container-lowest'
                      }`}
                    >
                      {option.badge && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                          {option.badge}
                        </span>
                      )}
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-3 rounded-xl ${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest'}`}>
                            {option.icon}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary fill-primary text-on-primary" />
                          )}
                        </div>

                        <h3 className="font-title-md text-title-md text-on-surface font-bold">
                          {option.title}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                          {option.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Continue Action Button */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary font-title-md text-title-md hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer font-semibold"
                >
                  <span>Continue to Basic Info</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/onboarding/profile')}
                  className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors py-2 px-4 rounded-lg"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStartPage;
