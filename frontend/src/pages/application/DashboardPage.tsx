import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Dumbbell,
  Activity,
  MoreVertical,
  Zap,
  Search,
  Droplets,
  GlassWater,
  Utensils,
  ChevronRight,
  ShieldCheck,
  Sunrise,
  Sun,
  Coffee,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Scale,
  Target,
  Award,
  Calendar,
} from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { analyticsService, DashboardAnalyticsResponse } from '../../services/analyticsService';
import { fetchDailyDiaryFromApi, mapBackendMealSectionToFrontend } from '../../services/diaryService';
import { MealSection } from '../../data/mockDiary';

export const DashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [userGreeting, setUserGreeting] = useState<string>('Welcome back');
  const [formattedDateStr, setFormattedDateStr] = useState<string>('');
  const [dashboardMeals, setDashboardMeals] = useState<MealSection[]>([]);


  const [waterMl, setWaterMl] = useState(2400);

  const targetWater = 3000;
  const waterPct = Math.min(100, Math.round((waterMl / targetWater) * 100));

  const [quickSearch, setQuickSearch] = useState('');

  const staplePills = [
    '+ Phulka (Roti)',
    '+ Dal Tadka',
    '+ Raw Paneer (50g)',
    '+ Idli (2 pcs)',
    '+ Upma (1 bowl)',
    '+ Roasted Chana',
  ];

  const periods = [
    { key: '7d', label: '7D' },
    { key: '14d', label: '14D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1Y' },
  ];

  useEffect(() => {
    let isMounted = true;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (isMounted) {
      setFormattedDateStr(dateStr);
    }

    async function loadUser() {
      try {
        const user = await getCurrentUser();
        if (isMounted && user && user.full_name) {
          setUserGreeting(`Welcome back, ${user.full_name}`);
        } else if (isMounted) {
          setUserGreeting('Welcome back');
        }
      } catch {
        if (isMounted) setUserGreeting('Welcome back');
      }
    }
    loadUser();

    async function loadMeals() {
      try {
        const todayYYYYMMDD = new Date().toISOString().split('T')[0];
        const { data } = await fetchDailyDiaryFromApi(todayYYYYMMDD);
        if (isMounted && data && data.meals) {
          setDashboardMeals(data.meals.map(mapBackendMealSectionToFrontend));
        }
      } catch {
        if (isMounted) setDashboardMeals([]);
      }
    }
    loadMeals();

    async function loadData() {

      setLoadingAnalytics(true);
      const data = await analyticsService.getDashboardAnalytics(selectedPeriod);
      if (isMounted) {
        setAnalytics(data);
        setLoadingAnalytics(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedPeriod]);


  const handleAddWater = (amount: number) => {
    setWaterMl((prev) => Math.min(targetWater + 1000, prev + amount));
  };

  const handleQuickPick = (pillText: string) => {
    const cleanName = pillText.replace('+', '').trim();
    setQuickSearch(cleanName);
  };

  const getMealIcon = (iconName: string) => {
    switch (iconName) {
      case 'wb_twilight':
      case 'sunrise':
        return <Sunrise className="w-5 h-5 text-primary shrink-0" />;
      case 'sunny':
      case 'wb_sunny':
        return <Sun className="w-5 h-5 text-primary shrink-0" />;
      case 'local_cafe':
      case 'coffee':
        return <Coffee className="w-5 h-5 text-secondary shrink-0" />;
      case 'bedtime':
      case 'dark_mode':
        return <Moon className="w-5 h-5 text-tertiary shrink-0" />;
      default:
        return <Utensils className="w-5 h-5 text-primary shrink-0" />;
    }
  };

  const getInsightIcon = (priority: string) => {
    switch (priority) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-error shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-secondary shrink-0" />;
    }
  };

  const getInsightBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'success':
        return 'bg-primary-fixed text-on-primary-fixed font-semibold';
      case 'warning':
        return 'bg-error-container text-on-error-container font-semibold';
      default:
        return 'bg-secondary-fixed text-on-secondary-fixed font-semibold';
    }
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'increasing' || direction === 'increased') {
      return <TrendingUp className="w-4 h-4 text-primary shrink-0" />;
    }
    if (direction === 'decreasing' || direction === 'decreased') {
      return <TrendingDown className="w-4 h-4 text-secondary shrink-0" />;
    }
    return <Minus className="w-4 h-4 text-on-surface-variant shrink-0" />;
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome & Period Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {userGreeting}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            {formattedDateStr || 'Today'} • Clinical Telemetry & Longitudinal Analytics
          </p>
        </div>


        {/* Time Range Selector & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-sm border border-outline-variant/30">
            <Calendar className="w-4 h-4 text-on-surface-variant ml-2 mr-1 shrink-0" />
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  selectedPeriod === p.key
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>

          <Link
            to="/app/diary"
            className="flex items-center gap-x-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md rounded-xl shadow-sm transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Log Meal / Food</span>
          </Link>
        </div>
      </div>

      {/* Top 5 Stat Cards — Driven by Longitudinal Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Current Weight Card */}
        <div className="flex flex-col p-5 bg-surface-container-lowest rounded-xl shadow-sm justify-between transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Current Body Weight
              </span>
              <div className="flex items-baseline gap-x-1 mt-1">
                <span className="font-numeric-metric text-numeric-metric text-on-surface">
                  {loadingAnalytics ? '...' : analytics?.overview.current_weight.toFixed(1)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">kg</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface-container text-primary">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 pt-1 border-t border-surface-container-low">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Velocity ({analytics?.period.toUpperCase() || '30D'})</span>
              <span className="font-semibold text-primary">
                {analytics?.weight.weekly_velocity && analytics.weight.weekly_velocity > 0 ? '+' : ''}
                {analytics?.weight.weekly_velocity.toFixed(2)} kg/wk
              </span>
            </div>
            <div className="text-[11px] font-body-sm text-on-surface-variant flex items-center justify-between">
              <span>7D Moving Avg:</span>
              <span className="font-medium">{analytics?.weight.moving_average_7d.toFixed(1)} kg</span>
            </div>
          </div>
        </div>

        {/* Calorie Adherence Card */}
        <div className="flex flex-col p-5 bg-surface-container-lowest rounded-xl shadow-sm justify-between transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Avg Daily Intake
              </span>
              <div className="flex items-baseline gap-x-1 mt-1">
                <span className="font-numeric-metric text-numeric-metric text-on-surface">
                  {loadingAnalytics ? '...' : Math.round(analytics?.overview.avg_daily_calories || 0)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  / {analytics?.calories.target_calories} kcal
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed font-semibold">
              {analytics?.calories.adherence_pct.toFixed(0)}% Adherent
            </span>
          </div>
          <div className="space-y-1 pt-1 border-t border-surface-container-low">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Target Window (90-110%)</span>
              <span className="text-primary font-medium">{analytics?.calories.days_meeting_target} days met</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, analytics?.calories.adherence_pct || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Protein Adherence Card */}
        <div className="flex flex-col p-5 bg-surface-container-lowest rounded-xl shadow-sm justify-between transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Protein Intake
              </span>
              <div className="flex items-baseline gap-x-1 mt-1">
                <span className="font-numeric-metric text-numeric-metric text-on-surface">
                  {loadingAnalytics ? '...' : analytics?.macros.protein.avg_intake.toFixed(1)}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  / {analytics?.macros.protein.target} g
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
              {analytics?.macros.protein.pct_of_target.toFixed(0)}% Target
            </span>
          </div>
          <div className="space-y-1 pt-1 border-t border-surface-container-low">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Longitudinal Trend</span>
              <span className="text-secondary font-medium capitalize">{analytics?.macros.protein.trend}</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, analytics?.macros.protein.pct_of_target || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Nutrition Consistency Score Card */}
        <div className="flex flex-col p-5 bg-surface-container-lowest rounded-xl shadow-sm justify-between transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Consistency Score
              </span>
              <div className="flex items-baseline gap-x-1 mt-1">
                <span className="font-numeric-metric text-numeric-metric text-primary font-bold">
                  {loadingAnalytics ? '...' : analytics?.consistency.score}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">/ 100</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface-container text-tertiary">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 pt-1 border-t border-surface-container-low">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Logging Rate:</span>
              <span className="font-semibold text-on-surface">{analytics?.consistency.logging_consistency.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, analytics?.consistency.score || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Goal Progress Card */}
        <div className="flex flex-col p-5 bg-surface-container-lowest rounded-xl shadow-sm justify-between transition-all hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Target Weight Goal
              </span>
              <div className="flex items-baseline gap-x-1 mt-1">
                <span className="font-numeric-metric text-numeric-metric text-on-surface">
                  {analytics?.goals?.target_weight ? analytics.goals.target_weight.toFixed(1) : 'Maintain'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {analytics?.goals?.target_weight ? 'kg' : ''}
                </span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface-container text-secondary">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1 pt-1 border-t border-surface-container-low">
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>Progress:</span>
              <span className="font-semibold text-secondary">{analytics?.goals?.progress_pct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, analytics?.goals?.progress_pct || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Insights Section */}
      <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-title-lg text-title-lg text-on-surface">
              Clinical Insights & Observational Telemetry ({selectedPeriod.toUpperCase()})
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-medium">
            Rule-Based Observational Engine
          </span>
        </div>

        {loadingAnalytics ? (
          <div className="p-4 text-center text-on-surface-variant font-body-sm">
            Loading longitudinal insights...
          </div>
        ) : !analytics?.insights || analytics.insights.length === 0 ? (
          <div className="p-4 text-center text-on-surface-variant font-body-sm">
            No specific clinical observations flagged for this period. Keep logging food and weight telemetry.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-x-3 transition-all hover:bg-surface-container-low/80"
              >
                {getInsightIcon(insight.priority)}
                <div className="flex flex-col gap-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      {insight.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-label-sm uppercase ${getInsightBadgeStyle(insight.priority)}`}>
                      {insight.category}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.metric && (
                    <div className="mt-1 inline-flex items-center gap-x-1 px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface font-mono w-fit">
                      <span>Value: {insight.metric.value} {insight.metric.unit}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-y-6">
          {/* Section 1: Detailed Longitudinal Weight & Adherence Analytics */}
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-low pb-4">
              <div className="flex items-center gap-x-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface">Longitudinal Performance & Adherence</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {analytics?.days_in_period}-Day Analysis Window • Real Database Aggregation
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-x-6 text-right">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Starting Weight</span>
                  <span className="font-title-md text-title-md text-on-surface">
                    {analytics?.weight.start_weight.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Current Weight</span>
                  <span className="font-title-md text-title-md text-primary font-semibold">
                    {analytics?.weight.current_weight.toFixed(1)} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Macronutrient Longitudinal Breakdown Grid */}
            <div className="flex flex-col gap-y-3">
              <h3 className="font-title-sm text-title-sm text-on-surface uppercase tracking-wider">
                Macronutrient Longitudinal Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Protein */}
                <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Protein</span>
                  <div className="my-1">
                    <span className="font-title-md text-title-md text-on-surface">
                      {analytics?.macros.protein.avg_intake.toFixed(1)}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant"> / {analytics?.macros.protein.target}g</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>{analytics?.macros.protein.pct_of_target.toFixed(0)}% Target</span>
                    {getTrendIcon(analytics?.macros.protein.trend || 'stable')}
                  </div>
                </div>

                {/* Carbs */}
                <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Carbohydrates</span>
                  <div className="my-1">
                    <span className="font-title-md text-title-md text-on-surface">
                      {analytics?.macros.carbs.avg_intake.toFixed(1)}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant"> / {analytics?.macros.carbs.target}g</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>{analytics?.macros.carbs.pct_of_target.toFixed(0)}% Target</span>
                    {getTrendIcon(analytics?.macros.carbs.trend || 'stable')}
                  </div>
                </div>

                {/* Fats */}
                <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Dietary Fats</span>
                  <div className="my-1">
                    <span className="font-title-md text-title-md text-on-surface">
                      {analytics?.macros.fat.avg_intake.toFixed(1)}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant"> / {analytics?.macros.fat.target}g</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>{analytics?.macros.fat.pct_of_target.toFixed(0)}% Target</span>
                    {getTrendIcon(analytics?.macros.fat.trend || 'stable')}
                  </div>
                </div>

                {/* Fiber */}
                <div className="p-3 bg-surface-container-low rounded-xl flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Dietary Fiber</span>
                  <div className="my-1">
                    <span className="font-title-md text-title-md text-on-surface">
                      {analytics?.macros.fiber.avg_intake.toFixed(1)}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant"> / {analytics?.macros.fiber.target}g</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span>{analytics?.macros.fiber.pct_of_target.toFixed(0)}% Target</span>
                    {getTrendIcon(analytics?.macros.fiber.trend || 'stable')}
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Period Comparison Card */}
            <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Previous Period Comparison (Current vs Prior {analytics?.days_in_period} Days)
                </span>
                <span className="font-label-sm text-label-sm text-primary font-medium">Comparative Telemetry</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Weight Comp */}
                <div className="flex flex-col p-2.5 bg-surface-container-lowest rounded-lg">
                  <span className="text-[11px] font-label-sm text-on-surface-variant">Weight Delta</span>
                  <div className="flex items-center gap-x-1 my-0.5">
                    {getTrendIcon(analytics?.comparisons.weight?.direction || 'stable')}
                    <span className="font-title-sm text-title-sm text-on-surface">
                      {analytics?.comparisons.weight?.absolute_change && analytics.comparisons.weight.absolute_change > 0 ? '+' : ''}
                      {analytics?.comparisons.weight?.absolute_change.toFixed(2)} kg
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">
                    Prev: {analytics?.comparisons.weight?.previous_value.toFixed(1)} kg
                  </span>
                </div>

                {/* Calorie Comp */}
                <div className="flex flex-col p-2.5 bg-surface-container-lowest rounded-lg">
                  <span className="text-[11px] font-label-sm text-on-surface-variant">Avg Daily Kcal</span>
                  <div className="flex items-center gap-x-1 my-0.5">
                    {getTrendIcon(analytics?.comparisons.calories?.direction || 'stable')}
                    <span className="font-title-sm text-title-sm text-on-surface">
                      {analytics?.comparisons.calories?.absolute_change && analytics.comparisons.calories.absolute_change > 0 ? '+' : ''}
                      {Math.round(analytics?.comparisons.calories?.absolute_change || 0)} kcal
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">
                    Prev: {Math.round(analytics?.comparisons.calories?.previous_value || 0)} kcal
                  </span>
                </div>

                {/* Protein Comp */}
                <div className="flex flex-col p-2.5 bg-surface-container-lowest rounded-lg">
                  <span className="text-[11px] font-label-sm text-on-surface-variant">Protein Intake</span>
                  <div className="flex items-center gap-x-1 my-0.5">
                    {getTrendIcon(analytics?.comparisons.protein?.direction || 'stable')}
                    <span className="font-title-sm text-title-sm text-on-surface">
                      {analytics?.comparisons.protein?.absolute_change && analytics.comparisons.protein.absolute_change > 0 ? '+' : ''}
                      {analytics?.comparisons.protein?.absolute_change.toFixed(1)} g
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">
                    Prev: {analytics?.comparisons.protein?.previous_value.toFixed(1)} g
                  </span>
                </div>

                {/* Logging Rate Comp */}
                <div className="flex flex-col p-2.5 bg-surface-container-lowest rounded-lg">
                  <span className="text-[11px] font-label-sm text-on-surface-variant">Logging Consistency</span>
                  <div className="flex items-center gap-x-1 my-0.5">
                    {getTrendIcon(analytics?.comparisons.logging_consistency?.direction || 'stable')}
                    <span className="font-title-sm text-title-sm text-on-surface">
                      {analytics?.comparisons.logging_consistency?.absolute_change && analytics.comparisons.logging_consistency.absolute_change > 0 ? '+' : ''}
                      {analytics?.comparisons.logging_consistency?.absolute_change.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant">
                    Prev: {analytics?.comparisons.logging_consistency?.previous_value.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Sub-panel */}
            <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between gap-3 text-on-surface-variant">
              <div className="flex items-center gap-x-2">
                <Activity className="w-4 h-4 text-tertiary shrink-0" />
                <p className="font-body-sm text-body-sm">
                  Calculated via <span className="text-on-surface font-medium">Mifflin-St Jeor TDEE</span> reference formula adjusted for moderate strength training frequency (4x/week).
                </p>
              </div>
              <Link to="/app/calculator" className="font-label-sm text-label-sm text-primary hover:underline shrink-0 font-medium">
                View Math
              </Link>
            </div>
          </div>

          {/* Section 2: Chronological Food Timeline */}
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Today's Meals</h2>
                <span className="px-2 py-0.5 bg-surface-container rounded-full font-label-sm text-label-sm text-on-surface-variant">
                  4 Meals Logged
                </span>
              </div>
              <Link
                to="/app/diary"
                className="flex items-center gap-x-1.5 px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg font-label-md text-label-md shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-primary" />
                <span>Add Custom Food</span>
              </Link>
            </div>

            {dashboardMeals.length === 0 ? (
              <div className="bg-surface-container-lowest p-8 rounded-xl text-center border border-outline-variant/30 shadow-sm">
                <Utensils className="w-8 h-8 text-on-surface-variant mx-auto mb-2 opacity-50" />
                <p className="font-body-md text-body-md text-on-surface-variant">No meals logged for today yet.</p>
                <Link
                  to="/app/diary"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Log Food in Diary</span>
                </Link>
              </div>
            ) : (
              dashboardMeals.map((meal) => {
                const totalKcal = meal.items.reduce((sum: number, item) => sum + item.calories, 0);
                const totalP = meal.items.reduce((sum: number, item) => sum + item.protein, 0).toFixed(1);
                const totalC = meal.items.reduce((sum: number, item) => sum + item.carbs, 0).toFixed(1);
                const totalF = meal.items.reduce((sum: number, item) => sum + item.fat, 0).toFixed(1);

                return (
                  <div key={meal.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-4">
                    <div className="p-4 bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-x-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                          {getMealIcon(meal.iconName)}
                        </div>
                        <div>
                          <h3 className="font-title-md text-title-md text-on-surface leading-tight">{meal.name}</h3>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {meal.time} • {meal.subtitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-x-4 text-right">
                        <div className="font-body-sm text-body-sm text-on-surface-variant">
                          <span className="text-on-surface font-semibold">{totalKcal}</span> kcal
                          <span className="mx-1.5">•</span>
                          <span>P {totalP}g</span>
                          <span className="mx-1">•</span>
                          <span>C {totalC}g</span>
                          <span className="mx-1">•</span>
                          <span>F {totalF}g</span>
                        </div>
                        <button aria-label="Meal Options" className="text-on-surface-variant hover:text-on-surface p-1" type="button">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-surface-container-low px-4">
                      {meal.items.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-x-3 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-primary-container shrink-0"></span>
                            <div className="flex flex-col min-w-0">
                              <span className="font-body-md text-body-md text-on-surface truncate">{item.foodName}</span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">{item.subtext}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-x-4 text-right shrink-0">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              P {item.protein}g • C {item.carbs}g • F {item.fat}g
                            </span>
                            <span className="font-body-md text-body-md font-medium text-on-surface w-16">
                              {item.calories} kcal
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-y-6">
          {/* Consistency Component Breakdown Widget */}
          <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Award className="w-5 h-5 text-tertiary" />
                <h2 className="font-title-md text-title-md text-on-surface">Consistency Score Math</h2>
              </div>
              <span className="font-label-sm text-label-sm font-bold text-primary">
                {analytics?.consistency.score} / 100
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Logging */}
              <div className="flex flex-col gap-y-1">
                <div className="flex justify-between text-xs font-label-sm text-on-surface-variant">
                  <span>Diary Logging (35%)</span>
                  <span className="font-medium">{analytics?.consistency.logging_consistency.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${analytics?.consistency.logging_consistency || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Calorie Adherence */}
              <div className="flex flex-col gap-y-1">
                <div className="flex justify-between text-xs font-label-sm text-on-surface-variant">
                  <span>Calorie Target (30%)</span>
                  <span className="font-medium">{analytics?.consistency.calorie_adherence.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full"
                    style={{ width: `${analytics?.consistency.calorie_adherence || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Protein Adherence */}
              <div className="flex flex-col gap-y-1">
                <div className="flex justify-between text-xs font-label-sm text-on-surface-variant">
                  <span>Protein Target (20%)</span>
                  <span className="font-medium">{analytics?.consistency.protein_adherence.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-tertiary h-full rounded-full"
                    style={{ width: `${analytics?.consistency.protein_adherence || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Fiber Adherence */}
              <div className="flex flex-col gap-y-1">
                <div className="flex justify-between text-xs font-label-sm text-on-surface-variant">
                  <span>Fiber Intake (15%)</span>
                  <span className="font-medium">{analytics?.consistency.fiber_adherence.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary-container h-full rounded-full"
                    style={{ width: `${analytics?.consistency.fiber_adherence || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Food Entry Widget */}
          <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-title-md text-title-md text-on-surface">Quick Food Entry</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Indian DB</span>
            </div>
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-on-surface-variant pointer-events-none" />
              <input
                className="w-full h-10 pl-9 pr-4 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm transition-all"
                placeholder="Type dish or ingredient..."
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Frequent Indian Staples</span>
              <div className="flex flex-wrap gap-2">
                {staplePills.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => handleQuickPick(pill)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary text-on-surface font-label-md text-label-md transition-all flex items-center gap-x-1"
                    type="button"
                  >
                    <span>{pill}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Water Tracker Widget */}
          <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <Droplets className="w-5 h-5 text-tertiary" />
                <h2 className="font-title-md text-title-md text-on-surface">Daily Hydration</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-primary font-semibold">
                {waterPct}% Reached
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-x-1">
                <span className="font-numeric-metric text-numeric-metric text-on-surface">
                  {waterMl.toLocaleString()}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">/ {targetWater.toLocaleString()} ml</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Goal: 12 glasses</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-tertiary-fixed-dim h-full rounded-full transition-all duration-300"
                style={{ width: `${waterPct}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleAddWater(250)}
                className="flex items-center justify-center gap-x-1.5 py-2 px-3 bg-surface-container-low hover:bg-surface-container rounded-lg font-label-md text-label-md text-on-surface transition-all"
                type="button"
              >
                <GlassWater className="w-4 h-4 text-primary" />
                <span>+ 250 ml Glass</span>
              </button>
              <button
                onClick={() => handleAddWater(500)}
                className="flex items-center justify-center gap-x-1.5 py-2 px-3 bg-surface-container-low hover:bg-surface-container rounded-lg font-label-md text-label-md text-on-surface transition-all"
                type="button"
              >
                <GlassWater className="w-4 h-4 text-primary" />
                <span>+ 500 ml Bottle</span>
              </button>
            </div>
          </div>

          {/* Regional Recommendation Card */}
          <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                Regional Recommendation
              </span>
              <Utensils className="w-4 h-4 text-on-surface-variant" />
            </div>
            <div className="relative rounded-lg overflow-hidden h-32 bg-surface-container">
              <img
                className="w-full h-full object-cover"
                alt="Sprouted Moong Khichdi"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF5ORY65h828zsLdf2L-RBXFAFesjLib-dzmVroprxLHk9E7ZncGO5gCa1GlBdUqDPKvIpYRRzyrNBwApb4z8vvrmC4RqCZf2AeJBqwQccwhuYQulakNRWCdg79FNJ-Ww4pO6pjLe2ydvgNM2KO6kZuEttl_uZG6J5_FSYaLP2KFyr8pfF9kwYWhzl_8gfIuHZaK5gkgIYVNUVM8xoerCFBNmPuY0oCE2to1I_Wi4Ke2PBM2ycyuA"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent flex items-end p-3">
                <span className="font-title-md text-title-md text-inverse-on-surface">Sprouted Moong Khichdi</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              High bioavailability protein source with lower glycemic spike, ideal for tomorrow's recovery dinner.
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="font-label-sm text-label-sm text-on-surface">P: 18g • 340 kcal</span>
              <Link to="/app/recipes" className="font-label-md text-label-md text-primary font-medium hover:underline flex items-center gap-x-0.5">
                <span>View Recipe</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Scientific Callout Badge */}
          <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2 text-primary font-semibold font-label-md text-label-md">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>ICMR-NIN IFCT Database</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              All dietary computations are calibrated strictly against the <em>Indian Food Composition Tables (IFCT)</em> compiled by the National Institute of Nutrition, Hyderabad.
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-on-surface-variant">
              <span>Version: 2024.1 R4</span>
              <span className="font-medium text-primary">Verified Clinical Lab Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

