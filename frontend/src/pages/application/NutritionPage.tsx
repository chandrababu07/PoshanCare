import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Sparkles,
  RefreshCw,
  Droplets,
  ArrowRight,
  ShieldCheck,
  Clock,
  Scale,
} from 'lucide-react';
import {
  fetchNutritionIntelligence,
  NutritionIntelligenceResponse,
} from '../../services/nutritionIntelligenceService';

export const NutritionPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7d' | '14d' | '30d'>('7d');
  const [data, setData] = useState<NutritionIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNutritionIntelligence(undefined, period);
      if (!result) {
        setError('Unable to load nutrition intelligence at this time. Please try again.');
      } else {
        setData(result);
      }
    } catch {
      setError('An error occurred while fetching your nutrition insights.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived macro calculations
  const summary = data?.summary;
  const actualCalories = summary?.calories.actual ?? 0;
  const targetCalories = summary?.calories.target ?? 2000;
  const proteinG = summary?.protein.actual_g ?? 0;
  const carbsG = summary?.carbs_g ?? 0;
  const fatG = summary?.fat_g ?? 0;
  const fiberG = summary?.fiber_g ?? 0;

  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  const carbsPct = totalMacroKcal > 0 ? Math.round((carbsKcal / totalMacroKcal) * 100) : 0;
  const fatPct = totalMacroKcal > 0 ? Math.round((fatKcal / totalMacroKcal) * 100) : 0;
  const proteinPct = totalMacroKcal > 0 ? Math.round((proteinKcal / totalMacroKcal) * 100) : 0;

  // SVG Donut calculation (circumference: 2 * pi * 38 ≈ 238.76)
  const circumference = 238.76;
  const carbsDash = (carbsPct / 100) * circumference;
  const fatDash = (fatPct / 100) * circumference;
  const proteinDash = (proteinPct / 100) * circumference;

  const availability = data?.data_availability;
  const isInsufficient = !data?.has_sufficient_data || availability?.sufficiency_level === 'insufficient_data';

  const getSufficiencyBadge = (level?: string) => {
    switch (level) {
      case 'strong_pattern':
        return { label: 'High Confidence (Multi-Day)', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
      case 'moderate_data':
        return { label: 'Moderate Evidence', bg: 'bg-primary-container/20 text-primary' };
      case 'limited_data':
        return { label: 'Initial Logs', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
      default:
        return { label: 'Insufficient Data', bg: 'bg-surface-container text-on-surface-variant' };
    }
  };

  const sufficiencyBadge = getSufficiencyBadge(availability?.sufficiency_level);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Nutrition Intelligence & Analytics
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Observational analysis mapped against your personalized targets and dietary profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7-Day' },
              { id: '14d', label: '14-Day' },
              { id: '30d', label: '30-Day' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id as typeof period)}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                  period === item.id
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2 rounded-xl bg-surface-container-lowest border border-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
            title="Refresh Intelligence"
            aria-label="Refresh intelligence"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-on-error-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <p className="font-body-md text-body-md">{error}</p>
          </div>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 rounded-lg bg-error text-white font-label-md text-label-md hover:bg-error/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* DATA AVAILABILITY SUMMARY BANNER */}
      {availability && (
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Evidence Level
                </span>
                <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold ${sufficiencyBadge.bg}`}>
                  {sufficiencyBadge.label}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {availability.explanation}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right shrink-0">
            <div className="flex flex-col">
              <span className="font-numeric-metric text-[16px] text-on-surface font-semibold">
                {availability.logged_days} {availability.logged_days === 1 ? 'day' : 'days'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Logged in period</span>
            </div>
            <div className="h-6 w-px bg-surface-container-low"></div>
            <div className="flex flex-col">
              <span className="font-numeric-metric text-[16px] text-on-surface font-semibold">
                {availability.total_meals_logged} {availability.total_meals_logged === 1 ? 'meal' : 'meals'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Total recorded</span>
            </div>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && !data && (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-xl bg-surface-container-low"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 rounded-xl bg-surface-container-low"></div>
            <div className="h-48 rounded-xl bg-surface-container-low"></div>
          </div>
        </div>
      )}

      {/* INSUFFICIENT DATA EMPTY STATE */}
      {!loading && isInsufficient && (
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-surface-container-low text-center flex flex-col items-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">More Food Logs Needed</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {data?.insufficient_data_reason || availability?.explanation || 'Log a few meals in your diary to generate your personalized nutrition breakdown and safe smart food suggestions.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/diary"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Go to Food Diary
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ACTIVE DATA PRESENTATION */}
      {!loading && !isInsufficient && (
        <>
          {/* SECTION 1: Caloric & Macro Distribution Overview */}
          <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-title-md text-title-md text-on-surface">Caloric & Macro Distribution Overview</h2>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Proportional caloric density across logged energy sources ({period === 'today' ? 'today' : `${period} daily average`})
                </span>
              </div>
              <span
                className={`font-label-sm text-label-sm px-2.5 py-1 rounded font-semibold ${
                  summary?.calories.status === 'within_range'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : summary?.calories.status === 'above_target'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-primary-container/20 text-primary'
                }`}
              >
                {summary?.calories.status === 'within_range'
                  ? 'Within Target'
                  : summary?.calories.status === 'above_target'
                  ? 'Above Target'
                  : 'Below Target'}
              </span>
            </div>

            {/* Chart & Summary Stats */}
            <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
              {/* Donut Chart */}
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="13"
                  />
                  {/* Carbs */}
                  {carbsDash > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="38"
                      stroke="#fe932c"
                      strokeDasharray={`${carbsDash} ${circumference}`}
                      strokeDashoffset="0"
                      strokeWidth="13"
                    />
                  )}
                  {/* Fat */}
                  {fatDash > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="38"
                      stroke="#904d00"
                      strokeDasharray={`${fatDash} ${circumference}`}
                      strokeDashoffset={-carbsDash}
                      strokeWidth="13"
                    />
                  )}
                  {/* Protein */}
                  {proteinDash > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="38"
                      stroke="#00513b"
                      strokeDasharray={`${proteinDash} ${circumference}`}
                      strokeDashoffset={-(carbsDash + fatDash)}
                      strokeWidth="13"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="font-numeric-metric text-[22px] leading-tight text-on-surface font-semibold">
                    {Math.round(actualCalories)}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    {period === 'today' ? 'Total Kcal' : 'Avg Kcal/Day'}
                  </span>
                </div>
              </div>

              {/* Legend Pills & Quantities */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-x-2">
                    <span className="w-3 h-3 rounded-sm bg-[#fe932c]"></span>
                    <span className="font-label-md text-label-md text-on-surface">Carbohydrates</span>
                  </div>
                  <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">
                    {carbsPct}%
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {Math.round(carbsKcal)} kcal ({carbsG.toFixed(1)}g)
                  </span>
                </div>

                <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-x-2">
                    <span className="w-3 h-3 rounded-sm bg-[#904d00]"></span>
                    <span className="font-label-md text-label-md text-on-surface">Dietary Fat</span>
                  </div>
                  <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">
                    {fatPct}%
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {Math.round(fatKcal)} kcal ({fatG.toFixed(1)}g)
                  </span>
                </div>

                <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-x-2">
                    <span className="w-3 h-3 rounded-sm bg-[#00513b]"></span>
                    <span className="font-label-md text-label-md text-on-surface">Protein</span>
                  </div>
                  <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">
                    {proteinPct}%
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {Math.round(proteinKcal)} kcal ({proteinG.toFixed(1)}g)
                  </span>
                </div>

                <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-x-2">
                    <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                    <span className="font-label-md text-label-md text-on-surface">Target Calorie Goal</span>
                  </div>
                  <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">
                    {Math.round(targetCalories)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {actualCalories >= targetCalories
                      ? `+${Math.round(actualCalories - targetCalories)} kcal variance`
                      : `-${Math.round(targetCalories - actualCalories)} kcal variance`}
                  </span>
                </div>
              </div>
            </div>

            {/* Fiber & Target Alignment Bar */}
            <div className="pt-2 border-t border-surface-container-low">
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Dietary Fiber</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    From whole grains, lentils, legumes, fruits, and vegetables
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-numeric-metric text-[16px] text-on-surface font-semibold">
                    {fiberG.toFixed(1)}g
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant block">
                    Target: {summary?.target_fiber_g ? `${summary.target_fiber_g}g` : '30-40g'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Nutrient Gaps & Opportunities */}
          {data?.nutrient_gaps && data.nutrient_gaps.length > 0 && (
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface">Nutrient Opportunities & Balance</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Observational comparison with personalized dietary reference values
                  </span>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  {data.nutrient_gaps.length} Nutrients Analyzed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.nutrient_gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                          {gap.nutrient}
                        </h3>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Observed avg: {gap.observed_daily_avg} {gap.unit} • Target: {gap.target_value} {gap.unit}
                        </span>
                      </div>
                      <span
                        className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                          gap.status === 'within_range'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : gap.status === 'above_target'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-primary-container/20 text-primary'
                        }`}
                      >
                        {gap.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {gap.explanation}
                    </p>

                    {gap.suggested_foods && gap.suggested_foods.length > 0 && (
                      <div className="pt-2 border-t border-surface-container">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1.5">
                          Suggested Whole Food Sources:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {gap.suggested_foods.map((food, fIdx) => (
                            <span
                              key={fIdx}
                              className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface border border-surface-container"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: Smart Substitutions (Database-backed) */}
          {data?.substitutions && data.substitutions.length > 0 && (
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface">Smart Food Substitutions</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Nutritional upgrades grounded in your personal preferences and catalog foods
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-label-sm text-label-sm font-semibold">Catalog Verified</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.substitutions.map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-xl bg-surface-container-low border border-surface-container space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                        {sub.current_food_name}
                      </span>
                      <span className="text-on-surface-variant font-label-sm">→</span>
                      <span className="font-label-md text-label-md text-primary font-semibold">
                        {sub.suggested_food_name}
                      </span>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface">
                      {sub.measurable_reason}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant">
                        {Math.round(sub.calories)} kcal
                      </span>
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant">
                        {sub.protein_g}g Protein
                      </span>
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant">
                        {sub.fiber_g}g Fiber
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: Observed Multi-Day Patterns */}
          {data?.patterns && data.patterns.length > 0 && (
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface">Observed Dietary Patterns</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Behavioral trends identified across multiple logged days
                  </span>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-on-surface-variant">
                  {data.patterns.length} Identified
                </span>
              </div>

              <div className="space-y-3">
                {data.patterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-label-md text-label-md text-on-surface font-semibold">
                          {pat.title}
                        </h3>
                        <span
                          className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold ${
                            pat.priority === 'high'
                              ? 'bg-primary-container/20 text-primary'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {pat.priority}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {pat.observation}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded border border-surface-container">
                        {pat.evidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: Chrono-Nutrition & Hydration/Activity Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chrono-Nutrition */}
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="font-title-md text-title-md text-on-surface">Chrono-Nutrition & Timing</h2>
                </div>
              </div>

              {data?.meal_timing ? (
                <div className="space-y-3">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {data.meal_timing.observation}
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">First Meal (Avg)</span>
                      <span className="font-numeric-metric text-[16px] text-on-surface font-semibold">
                        {data.meal_timing.avg_breakfast_time || 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low">
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Last Meal (Avg)</span>
                      <span className="font-numeric-metric text-[16px] text-on-surface font-semibold">
                        {data.meal_timing.avg_dinner_time || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Log meal times to generate circadian eating window analysis.
                </p>
              )}
            </div>

            {/* Hydration & Activity Context */}
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-secondary" />
                  <h2 className="font-title-md text-title-md text-on-surface">Hydration & Activity Context</h2>
                </div>
              </div>

              {data?.hydration_activity_context ? (
                <div className="space-y-3">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {data.hydration_activity_context.observation}
                  </p>
                  {data.hydration_activity_context.has_combined_data && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-surface-container-low">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">Active Days Water</span>
                        <span className="font-numeric-metric text-[16px] text-on-surface font-semibold">
                          {data.hydration_activity_context.avg_water_on_active_days_ml ?? 0} ml
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-container-low">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">Rest Days Water</span>
                        <span className="font-numeric-metric text-[16px] text-on-surface font-semibold">
                          {data.hydration_activity_context.avg_water_on_rest_days_ml ?? 0} ml
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Log both water and daily physical activity to synthesize lifestyle correlations.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 6: Today's Actionable Focus */}
          {data?.daily_actions && data.daily_actions.length > 0 && (
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface">Recommended Actions Today</h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Concrete, achievable daily steps based on your latest nutrition patterns
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.daily_actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold ${
                            act.priority === 'high'
                              ? 'bg-primary-container/20 text-primary'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {act.priority} priority
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {act.category}
                        </span>
                      </div>
                      <h3 className="font-label-md text-label-md text-on-surface font-semibold">
                        {act.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {act.description}
                      </p>
                    </div>

                    {act.route && (
                      <Link
                        to={act.route}
                        className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-primary font-semibold hover:underline pt-2"
                      >
                        Open {act.route.replace('/', '')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NutritionPage;
