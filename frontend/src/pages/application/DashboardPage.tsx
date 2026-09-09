import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Activity,
  Zap,
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
  Award,
  Calendar,
  RefreshCw,
  Eye,
  BookOpen,
} from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { analyticsService, DashboardAnalyticsResponse } from '../../services/analyticsService';
import { fetchDailyDiaryFromApi, mapBackendMealSectionToFrontend, BackendDailyDiaryResponse } from '../../services/diaryService';
import { MealSection } from '../../data/mockDiary';
import { fetchUserProfile, BackendProfileResponse } from '../../services/profileService';

const maxOne = (val: number) => Math.max(1, val);

export const DashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [analyticsError, setAnalyticsError] = useState<boolean>(false);

  const [userFullName, setUserFullName] = useState<string>('');
  const [profile, setProfile] = useState<BackendProfileResponse | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const [formattedDateStr, setFormattedDateStr] = useState<string>('');
  const [todayDateKey, setTodayDateKey] = useState<string>('');
  const [dashboardMeals, setDashboardMeals] = useState<MealSection[]>([]);
  const [todayDiary, setTodayDiary] = useState<BackendDailyDiaryResponse | null>(null);

  // Per-user per-date persisted water tracking
  const [waterMl, setWaterMl] = useState<number>(0);
  const targetWaterMl = 2500;

  // Simple Mode Accessibility Toggle
  const [simpleMode, setSimpleMode] = useState<boolean>(() => {
    return localStorage.getItem('poshancare_simple_mode') === 'true';
  });

  const periods = [
    { key: '7d', label: '7D' },
    { key: '14d', label: '14D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
  ];

  // Time-based greeting helper
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Persona Badge text
  const getPersonaLabel = () => {
    if (!profile?.profile_type) return 'Adult';
    switch (profile.profile_type) {
      case 'child':
        return 'Child Profile';
      case 'teen':
        return 'Teen Profile';
      case 'older_adult':
        return 'Senior / Elder Profile';
      case 'family':
        return 'Family Household';
      default:
        return 'Adult Profile';
    }
  };

  const toggleSimpleMode = () => {
    setSimpleMode((prev) => {
      const next = !prev;
      localStorage.setItem('poshancare_simple_mode', String(next));
      return next;
    });
  };

  const loadAllDashboardData = async () => {
    setLoadingAnalytics(true);
    setAnalyticsError(false);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const yyyymmdd = now.toISOString().split('T')[0];

    setFormattedDateStr(dateStr);
    setTodayDateKey(yyyymmdd);

    // 1. Load User & Profile
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserFullName(user.full_name || 'Friend');
        setUserId(user.id);

        // Load water from localStorage for this user and date
        const storageKey = `poshancare_water_${user.id}_${yyyymmdd}`;
        const savedWater = localStorage.getItem(storageKey);
        if (savedWater !== null) {
          setWaterMl(parseInt(savedWater, 10) || 0);
        } else {
          setWaterMl(0);
        }
      }
    } catch {
      setUserFullName('Friend');
    }

    try {
      const prof = await fetchUserProfile();
      if (prof) setProfile(prof);
    } catch (e) {
      console.warn('Profile load info:', e);
    }

    // 2. Load Today's Diary Meals
    try {
      const { data } = await fetchDailyDiaryFromApi(yyyymmdd);
      if (data) {
        setTodayDiary(data);
        if (data.meals) {
          setDashboardMeals(data.meals.map(mapBackendMealSectionToFrontend));
        }
      }
    } catch (e) {
      console.warn('Diary load error:', e);
      setDashboardMeals([]);
    }

    // 3. Load Longitudinal Analytics
    try {
      const analyticsData = await analyticsService.getDashboardAnalytics(selectedPeriod);
      if (analyticsData) {
        setAnalytics(analyticsData);
      } else {
        setAnalyticsError(true);
      }
    } catch {
      setAnalyticsError(true);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAllDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const handleAddWater = (amount: number) => {
    setWaterMl((prev) => {
      const next = Math.min(targetWaterMl + 1500, prev + amount);
      if (userId && todayDateKey) {
        localStorage.setItem(`poshancare_water_${userId}_${todayDateKey}`, String(next));
      }
      return next;
    });
  };

  const getMealIcon = (iconName: string) => {
    switch (iconName) {
      case 'wb_twilight':
      case 'sunrise':
        return <Sunrise className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'sunny':
      case 'wb_sunny':
        return <Sun className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'local_cafe':
      case 'coffee':
        return <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />;
      case 'bedtime':
      case 'dark_mode':
        return <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      default:
        return <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
  };

  const getInsightIcon = (priority: string) => {
    switch (priority) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'increasing' || direction === 'increased') {
      return <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (direction === 'decreasing' || direction === 'decreased') {
      return <TrendingDown className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    return <Minus className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  // Compute Today's Intake Totals
  const todayCalories = todayDiary ? Math.round(todayDiary.grand_total_calories) : 0;
  const targetCalories = todayDiary ? Math.round(todayDiary.target_calories) : (analytics?.calories.target_calories || 2000);

  const todayProtein = todayDiary ? parseFloat(todayDiary.grand_total_protein.toFixed(1)) : 0;
  const targetProtein = todayDiary ? Math.round(todayDiary.target_protein) : (analytics?.macros.protein.target || 80);

  const todayCarbs = todayDiary ? parseFloat(todayDiary.grand_total_carbs.toFixed(1)) : 0;
  const targetCarbs = todayDiary ? Math.round(todayDiary.target_carbs) : (analytics?.macros.carbs.target || 250);

  const todayFat = todayDiary ? parseFloat(todayDiary.grand_total_fat.toFixed(1)) : 0;
  const targetFat = todayDiary ? Math.round(todayDiary.target_fat) : (analytics?.macros.fat.target || 65);

  const hasLoggedMealsToday = dashboardMeals.some((m) => m.items && m.items.length > 0);
  const waterPct = Math.min(100, Math.round((waterMl / targetWaterMl) * 100));

  return (
    <div className={`space-y-8 ${simpleMode ? 'text-lg space-y-10 font-sans' : ''}`}>
      {/* Non-blocking API Error Banner */}
      {analyticsError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-medium">
              Some analytics telemetry couldn't be loaded from the server right now.
            </span>
          </div>
          <button
            type="button"
            onClick={loadAllDashboardData}
            className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 1. PERSONALIZED HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider">
              {getPersonaLabel()}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              {formattedDateStr || 'Today'}
            </span>
          </div>
          <h1 className={`${simpleMode ? 'text-3xl font-black' : 'text-2xl sm:text-3xl font-bold'} text-slate-900 dark:text-white tracking-tight`}>
            {getGreetingTime()}, {userFullName || 'Friend'} 👋
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {profile?.profile_type === 'child'
              ? 'Welcome to your daily health & wholesome energy dashboard!'
              : profile?.profile_type === 'older_adult'
              ? 'Here is your simple daily nutrition and wellness summary.'
              : 'Your personalized nutrition intelligence & daily health overview.'}
          </p>
        </div>

        {/* Header Controls: Simple Mode Toggle & Time Period Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleSimpleMode}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              simpleMode
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
            title="Toggle high-contrast large font accessibility mode"
          >
            <Eye className="w-4 h-4" />
            <span>{simpleMode ? 'Simple Mode ON' : 'Accessibility View'}</span>
          </button>

          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1 shrink-0" />
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  selectedPeriod === p.key
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 8. QUICK ACTIONS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/app/diary"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex items-center gap-3 min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Log Food</span>
            <span className="text-xs text-slate-500">Record today's meals</span>
          </div>
        </Link>

        <Link
          to="/app/weight"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex items-center gap-3 min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Log Weight</span>
            <span className="text-xs text-slate-500">Update progress</span>
          </div>
        </Link>

        <Link
          to="/app/recipes"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex items-center gap-3 min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Find Recipes</span>
            <span className="text-xs text-slate-500">Regional meal ideas</span>
          </div>
        </Link>

        <Link
          to="/app/reports"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex items-center gap-3 min-h-[56px] group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-slate-900 dark:text-white">View Reports</span>
            <span className="text-xs text-slate-500">Longitudinal analytics</span>
          </div>
        </Link>
      </div>

      {/* 2. TODAY'S NUTRITION SUMMARY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today's Daily Energy &amp; Nutrient Target
            </h2>
          </div>
          <Link
            to="/app/diary"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>Food Diary</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Macro Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Calories */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daily Energy
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Target: {targetCalories} kcal
              </span>
            </div>
            <div>
              {!hasLoggedMealsToday ? (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
                  Nothing logged yet
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {todayCalories.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {targetCalories} kcal</span>
                </div>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayCalories / maxOne(targetCalories)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Protein */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Protein
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Target: {targetProtein}g
              </span>
            </div>
            <div>
              {!hasLoggedMealsToday ? (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
                  Nothing logged yet
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {todayProtein}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {targetProtein}g</span>
                </div>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayProtein / maxOne(targetProtein)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Carbohydrates
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Target: {targetCarbs}g
              </span>
            </div>
            <div>
              {!hasLoggedMealsToday ? (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
                  Nothing logged yet
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {todayCarbs}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {targetCarbs}g</span>
                </div>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayCarbs / maxOne(targetCarbs)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Fats */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Healthy Fats
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Target: {targetFat}g
              </span>
            </div>
            <div>
              {!hasLoggedMealsToday ? (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
                  Nothing logged yet
                </span>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {todayFat}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ {targetFat}g</span>
                </div>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayFat / maxOne(targetFat)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 3. TODAY'S MEALS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's Meals</h2>
              </div>
              <Link
                to="/app/diary"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Log Meal</span>
              </Link>
            </div>

            {!hasLoggedMealsToday ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Your food diary is empty for today</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Log your first meal to start tracking your energy intake, protein, and daily nutrition targets.
                  </p>
                </div>
                <Link
                  to="/app/diary"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs min-h-[44px]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Log your first meal</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {dashboardMeals.map((meal) => {
                  if (!meal.items || meal.items.length === 0) return null;
                  const totalKcal = meal.items.reduce((sum, item) => sum + item.calories, 0);
                  const totalP = meal.items.reduce((sum, item) => sum + item.protein, 0).toFixed(1);

                  return (
                    <div key={meal.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center">
                            {getMealIcon(meal.iconName)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{meal.name}</h3>
                            <span className="text-xs text-slate-500">{meal.time}</span>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {totalKcal} kcal • P: {totalP}g
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 px-4">
                        {meal.items.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="font-semibold text-slate-900 dark:text-white">{item.foodName}</span>
                              <span className="text-slate-500 dark:text-slate-400">({item.serving})</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{item.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. WEIGHT & PROGRESS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weight &amp; Progress Trend</h2>
              </div>
              <Link
                to="/app/weight"
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>+ Log Weight</span>
              </Link>
            </div>

            {loadingAnalytics ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading weight trend...</div>
            ) : !analytics?.has_weight_data ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Scale className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Start tracking your progress</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add your first weight entry to calculate moving averages, weekly velocity, and goal progress over time.
                  </p>
                </div>
                <Link
                  to="/app/weight"
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs min-h-[44px]"
                >
                  <Scale className="w-4 h-4" />
                  <span>Log your weight</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Current Weight</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {analytics.weight.current_weight.toFixed(1)} kg
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Moving Avg: {analytics.weight.moving_average_7d.toFixed(1)} kg
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Velocity</span>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(analytics.weight.trend_direction)}
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analytics.weight.weekly_velocity > 0 ? '+' : ''}{analytics.weight.weekly_velocity} kg/wk
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 capitalize">Trend: {analytics.weight.trend_direction}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Target Weight Goal</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {analytics.goals?.target_weight ? `${analytics.goals.target_weight.toFixed(1)} kg` : 'Maintain'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    {analytics.goals ? `${analytics.goals.progress_pct}% of goal reached` : 'Baseline steady'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 5. CONSISTENCY & HABITS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Consistency Score</h2>
              </div>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {analytics?.has_diary_data ? `${analytics.consistency.score} / 100` : '0 / 100'}
              </span>
            </div>

            {!analytics?.has_diary_data ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Keep logging your meals consistently to unlock your personal habit and adherence scores.
              </p>
            ) : (
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Diary Logging</span>
                    <span className="font-semibold">{analytics.consistency.logging_consistency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${analytics.consistency.logging_consistency}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Calorie Target</span>
                    <span className="font-semibold">{analytics.consistency.calorie_adherence}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${analytics.consistency.calorie_adherence}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. DAILY HYDRATION WATER TRACKER */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Hydration</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {waterPct}% Goal
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{waterMl}</span>
                <span className="text-xs text-slate-500">/ {targetWaterMl} ml</span>
              </div>
              <span className="text-xs text-slate-500">Goal: ~10 glasses</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${waterPct}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <GlassWater className="w-4 h-4 text-blue-500" />
                <span>+ 250 ml</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(500)}
                className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <GlassWater className="w-4 h-4 text-blue-500" />
                <span>+ 500 ml</span>
              </button>
            </div>
          </div>

          {/* 7. PERSONALIZED CLINICAL INSIGHTS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Personalized Insights</h2>
            </div>

            {loadingAnalytics ? (
              <div className="text-xs text-slate-400">Loading insights...</div>
            ) : !analytics?.insights || analytics.insights.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Your personalized insights will appear as you build your daily nutrition history.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {analytics.insights.map((insight, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs">
                    {getInsightIcon(insight.priority)}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-900 dark:text-white">{insight.title}</span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified ICMR Reference Standard Badge */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">ICMR-NIN IFCT Standard</span>
              <p className="text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                Calibrated against Indian Food Composition Tables (NIN Hyderabad).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
