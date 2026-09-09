import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

export const HealthContextPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [healthConditions, setHealthConditions] = useState<string[]>(
    data.healthConditions || ['None']
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const conditionOptions = [
    {
      id: 'None',
      label: 'General Wellness / No Specific Condition',
      desc: 'Focus on balanced nutrition, vitality, and natural energy.',
      icon: '🌿',
    },
    {
      id: 'Diabetes / Blood Sugar',
      label: 'Blood Sugar & Diabetes Support',
      desc: 'Low glycemic index meals, balanced fiber, and steady glucose release.',
      icon: '📊',
    },
    {
      id: 'High Blood Pressure',
      label: 'Blood Pressure & Heart Health',
      desc: 'Sodium-conscious recipes enriched with potassium, magnesium, and healthy lipids.',
      icon: '❤️',
    },
    {
      id: 'High Cholesterol',
      label: 'Cholesterol & Lipid Support',
      desc: 'Soluble fiber, oats, legumes, and unsaturated plant oils.',
      icon: '🥑',
    },
    {
      id: 'Digestive Sensitivity',
      label: 'Digestive Comfort & Acid Reflux',
      desc: 'Gentle, easy-to-digest home cooking with light spices and prebiotic fibers.',
      icon: '🍵',
    },
    {
      id: 'Pregnancy / Postpartum',
      label: 'Pregnancy & Postpartum Care',
      desc: 'Nourishing meals packed with folate, iron, calcium, and essential nutrients.',
      icon: '👶',
    },
  ];

  const toggleCondition = (id: string) => {
    if (id === 'None') {
      setHealthConditions(['None']);
      return;
    }

    const filtered = healthConditions.filter((c) => c !== 'None');
    if (filtered.includes(id)) {
      const remaining = filtered.filter((c) => c !== id);
      setHealthConditions(remaining.length === 0 ? ['None'] : remaining);
    } else {
      setHealthConditions([...filtered, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    updateData(
      {
        healthConditions,
      },
      9
    );

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/onboarding/review');
    }, 400);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium text-xs tracking-wider uppercase">
              Step 9 of 10
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs tracking-wide">
              • Health Considerations &amp; Wellness
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 dark:text-white font-bold tracking-tight">
            Any health considerations we should align with?
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Sharing any relevant health focus helps PoshanCare prioritize wholesome recipe options that match your needs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Conditions Selection Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Health Focus &amp; Considerations (Optional)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {conditionOptions.map((opt) => {
              const isSelected = healthConditions.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleCondition(opt.id)}
                  className={`p-5 rounded-2xl cursor-pointer border transition-all flex flex-col gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{opt.icon}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {opt.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear Medical Disclaimer Card */}
        <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-800/50 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Important Health &amp; Medical Disclaimer
            </h3>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              PoshanCare provides general lifestyle and nutritional educational suggestions designed to promote healthy daily living. It does not provide medical diagnosis, clinical treatment, or replace individualized care from a qualified doctor or clinical dietitian. Always consult your healthcare provider regarding specific medical conditions or dietary changes.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/onboarding/meal-habits')}
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
                <span>Saving...</span>
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <span>Review &amp; Finalize</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthContextPage;
