import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts & Guards
import AppLayout from '../components/layout/AppLayout';
import AuthLayout from '../components/layout/AuthLayout';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import OnboardingRoute from '../components/auth/OnboardingRoute';

// Suspense Fallback Loader
const PageLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Landing Page
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));

// Auth Pages
const SignInPage = lazy(() => import('../pages/auth/SignInPage'));
const SignUpPage = lazy(() => import('../pages/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Onboarding Pages
const OnboardingStartPage = lazy(() => import('../pages/onboarding/OnboardingStartPage'));
const ProfilePage = lazy(() => import('../pages/onboarding/ProfilePage'));
const BodyMetricsPage = lazy(() => import('../pages/onboarding/BodyMetricsPage'));
const ActivityPage = lazy(() => import('../pages/onboarding/ActivityPage'));
const GoalsPage = lazy(() => import('../pages/onboarding/GoalsPage'));
const DietPreferencesPage = lazy(() => import('../pages/onboarding/DietPreferencesPage'));
const MealHabitsPage = lazy(() => import('../pages/onboarding/MealHabitsPage'));
const HealthContextPage = lazy(() => import('../pages/onboarding/HealthContextPage'));
const ReviewPage = lazy(() => import('../pages/onboarding/ReviewPage'));

// Application Pages
const DashboardPage = lazy(() => import('../pages/application/DashboardPage'));
const DiaryPage = lazy(() => import('../pages/application/DiaryPage'));
const FoodsPage = lazy(() => import('../pages/application/FoodsPage'));
const CalculatorPage = lazy(() => import('../pages/application/CalculatorPage'));
const NutritionPage = lazy(() => import('../pages/application/NutritionPage'));
const WeightPage = lazy(() => import('../pages/application/WeightPage'));
const RecipesPage = lazy(() => import('../pages/application/RecipesPage'));
const ReportsPage = lazy(() => import('../pages/application/ReportsPage'));
const ActivityTrackingPage = lazy(() => import('../pages/application/ActivityTrackingPage'));

// Shared / Settings Pages
const ProfileSettingsPage = lazy(() => import('../pages/shared/ProfileSettingsPage'));
const NotificationsPage = lazy(() => import('../pages/shared/NotificationsPage'));
const SettingsPage = lazy(() => import('../pages/shared/SettingsPage'));
const HelpPage = lazy(() => import('../pages/shared/HelpPage'));
const SearchPage = lazy(() => import('../pages/shared/SearchPage'));
const NotFoundPage = lazy(() => import('../pages/shared/NotFoundPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Authentication Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Onboarding Routes */}
        <Route element={<OnboardingRoute />}>
          <Route element={<OnboardingLayout />}>
            <Route path="/onboarding" element={<OnboardingStartPage />} />
            <Route path="/onboarding/profile" element={<ProfilePage />} />
            <Route path="/onboarding/body-metrics" element={<BodyMetricsPage />} />
            <Route path="/onboarding/activity" element={<ActivityPage />} />
            <Route path="/onboarding/goals" element={<GoalsPage />} />
            <Route path="/onboarding/diet-preferences" element={<DietPreferencesPage />} />
            <Route path="/onboarding/meal-habits" element={<MealHabitsPage />} />
            <Route path="/onboarding/health-context" element={<HealthContextPage />} />
            <Route path="/onboarding/review" element={<ReviewPage />} />
          </Route>
        </Route>

        {/* Protected Main Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/app/diary" element={<DiaryPage />} />
            <Route path="/app/foods" element={<FoodsPage />} />
            <Route path="/app/calculator" element={<CalculatorPage />} />
            <Route path="/app/nutrition" element={<NutritionPage />} />
            <Route path="/app/weight" element={<WeightPage />} />
            <Route path="/app/activity" element={<ActivityTrackingPage />} />
            <Route path="/app/recipes" element={<RecipesPage />} />
            <Route path="/app/reports" element={<ReportsPage />} />

            {/* Shared / Profile / Settings Routes */}
            <Route path="/profile" element={<ProfileSettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
