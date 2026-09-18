import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Download,
  Trash2,
  ChevronRight,
  User,
  Lock,
  Sliders,
  Bell,
  CheckCircle2,
  Globe,
  Scale,
  Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  notificationService,
  NotificationPreferenceResponse,
} from '../../services/notificationService';
import {
  fetchUserProfile,
  patchUserProfile,
  BackendProfileResponse,
} from '../../services/profileService';
import { getUserBrowserTimezone } from '../../utils/formatters';

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const displayName = user?.full_name || 'User';
  const { t, i18n } = useTranslation(['settings', 'common']);

  const [prefs, setPrefs] = useState<NotificationPreferenceResponse | null>(null);
  const [profile, setProfile] = useState<BackendProfileResponse | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState<boolean>(true);
  const [savingField, setSavingField] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [regionalSavedSuccess, setRegionalSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoadingPrefs(true);
      try {
        const [prefsRes, profileRes] = await Promise.all([
          notificationService.getPreferences(),
          fetchUserProfile(),
        ]);
        if (prefsRes) setPrefs(prefsRes);
        if (profileRes) setProfile(profileRes);
      } finally {
        setLoadingPrefs(false);
      }
    }
    loadData();
  }, []);

  const handleTogglePref = async (field: keyof NotificationPreferenceResponse, value: boolean) => {
    if (!prefs) return;
    setSavingField(field as string);
    setSavedSuccess(false);

    const patch = { [field]: value };
    const updated = await notificationService.updatePreferences(patch);
    if (updated) {
      setPrefs(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
    setSavingField('');
  };

  const handleLanguageChange = async (lang: 'en' | 'hi' | 'te') => {
    i18n.changeLanguage(lang);
    setRegionalSavedSuccess(true);
    setTimeout(() => setRegionalSavedSuccess(false), 3000);
    try {
      const updated = await patchUserProfile({ preferred_language: lang });
      if (updated) setProfile(updated);
    } catch (e) {
      console.error('Failed to persist language preference', e);
    }
  };

  const handleUnitSystemChange = async (unit: 'metric' | 'imperial') => {
    setRegionalSavedSuccess(true);
    setTimeout(() => setRegionalSavedSuccess(false), 3000);
    try {
      const updated = await patchUserProfile({ unit_system: unit });
      if (updated) setProfile(updated);
    } catch (e) {
      console.error('Failed to persist unit preference', e);
    }
  };

  const handleTimezoneChange = async (tz: string) => {
    setRegionalSavedSuccess(true);
    setTimeout(() => setRegionalSavedSuccess(false), 3000);
    try {
      const updated = await patchUserProfile({ timezone: tz });
      if (updated) setProfile(updated);
    } catch (e) {
      console.error('Failed to persist timezone preference', e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('title', 'Account & Platform Settings')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('subtitle', 'Manage your personal profile, unit systems, notification reminders, privacy controls, and data choices.')}
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">{displayName}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {user?.auth_provider || 'email'} authenticated
            </span>
          </div>
        </div>

        <Link
          to="/profile"
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 min-h-[44px]"
        >
          <span>{t('view_profile', 'View Profile')}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* LANGUAGE & REGIONAL PREFERENCES CONTROL CARD */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('language_title', 'Language & Regional Preferences')}
            </h2>
          </div>
          {regionalSavedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('saved', 'Saved')}</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500">
          {t('language_subtitle', 'Select your interface language, unit system, and timezone')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Display Language */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {t('language_label', 'Display Language')}
            </label>
            <div className="flex flex-col gap-2">
              {[
                { code: 'en', label: 'English', native: 'English' },
                { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                { code: 'te', label: 'Telugu', native: 'తెలుగు' },
              ].map((lang) => {
                const isCurrent = i18n.language.startsWith(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code as 'en' | 'hi' | 'te')}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-medium min-h-[44px] transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    aria-pressed={isCurrent}
                  >
                    <span>{lang.native}</span>
                    <span className="text-[11px] text-slate-400">({lang.label})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Measurement Unit System */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {t('unit_system_label', 'Measurement Unit System')}
            </label>
            <div className="flex flex-col gap-2">
              {[
                { system: 'metric', label: t('metric_label', 'Metric (kg, cm, ml)') },
                { system: 'imperial', label: t('imperial_label', 'Imperial (lbs, ft/in, fl oz)') },
              ].map((u) => {
                const currentUnit = profile?.unit_system || 'metric';
                const isCurrent = currentUnit === u.system;
                return (
                  <button
                    key={u.system}
                    type="button"
                    onClick={() => handleUnitSystemChange(u.system as 'metric' | 'imperial')}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-medium min-h-[44px] transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    aria-pressed={isCurrent}
                  >
                    <span>{u.label}</span>
                    <Scale className="w-3.5 h-3.5 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone Preference */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {t('timezone_label', 'Timezone Preference')}
            </label>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <select
                  value={profile?.timezone || getUserBrowserTimezone()}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-label={t('timezone_label', 'Timezone Preference')}
                >
                  {Array.from(new Set([profile?.timezone || '', getUserBrowserTimezone(), ...COMMON_TIMEZONES]))
                    .filter(Boolean)
                    .map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Detected: {getUserBrowserTimezone()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION REMINDER PREFERENCES CONTROL CARD */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('notifications_title', 'Notification & Reminder Preferences')}
            </h2>
          </div>
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('saved', 'Saved')}</span>
            </span>
          )}
        </div>

        {loadingPrefs ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading preferences...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* Meal Reminders */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {t('meal_reminders', 'Meal & Food Diary Reminders')}
                </span>
                <span className="text-slate-500">
                  {t('meal_reminders_sub', 'Prompts for logging unlogged meals & tracking streaks')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('meal_reminders_enabled', !prefs?.meal_reminders_enabled)}
                disabled={savingField === 'meal_reminders_enabled'}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  prefs?.meal_reminders_enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs?.meal_reminders_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Hydration Reminders */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {t('hydration_reminders', 'Hydration Check Reminders')}
                </span>
                <span className="text-slate-500">
                  {t('hydration_reminders_sub', 'Prompts to reach your daily water intake target')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('hydration_reminders_enabled', !prefs?.hydration_reminders_enabled)}
                disabled={savingField === 'hydration_reminders_enabled'}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  prefs?.hydration_reminders_enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs?.hydration_reminders_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Activity Prompts */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {t('activity_prompts', 'Activity & Movement Prompts')}
                </span>
                <span className="text-slate-500">
                  {t('activity_prompts_sub', 'Encouragement for active play, steps & exercise')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('activity_reminders_enabled', !prefs?.activity_reminders_enabled)}
                disabled={savingField === 'activity_reminders_enabled'}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  prefs?.activity_reminders_enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs?.activity_reminders_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Weight Reminders */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {t('weight_reminders', 'Weight Log Updates (Adults)')}
                </span>
                <span className="text-slate-500">
                  {t('weight_reminders_sub', 'Track periodic body composition progress')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('weight_reminders_enabled', !prefs?.weight_reminders_enabled)}
                disabled={savingField === 'weight_reminders_enabled'}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  prefs?.weight_reminders_enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs?.weight_reminders_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Goal Updates */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {t('goal_updates', 'Health Goal Milestones')}
                </span>
                <span className="text-slate-500">
                  {t('goal_updates_sub', 'Alerts when reaching 50% and 100% of health goals')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('goal_updates_enabled', !prefs?.goal_updates_enabled)}
                disabled={savingField === 'goal_updates_enabled'}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  prefs?.goal_updates_enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs?.goal_updates_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Weekly Summaries */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  {t('weekly_summaries', 'Weekly Health Summaries')}
                </span>
                <span className="text-slate-500">
                  {t('weekly_summaries_sub', 'Weekly reports summarizing 7-day tracking activity')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('weekly_summary_enabled', !prefs?.weekly_summary_enabled)}
                disabled={savingField === 'weekly_summary_enabled'}
                className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  prefs?.weekly_summary_enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs?.weekly_summary_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Privacy & Health Data Management */}
        <Link
          to="/app/privacy-data"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('privacy_card_title', 'Privacy & Health Data')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('privacy_card_sub', 'Categories, export & account deletion')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{t('manage_privacy', 'Manage Privacy Controls')}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Onboarding Preferences */}
        <Link
          to="/onboarding/profile"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('dietary_card_title', 'Dietary & Goal Preferences')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('dietary_card_sub', 'Update unit system, RDA goals & persona')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{t('edit_preferences', 'Edit Profile Preferences')}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Direct Privacy Summary List */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>{t('security_summary', 'Security & Data Control Summary')}</span>
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-300">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-400" />
              <span>{t('data_export', 'Structured Data Export (JSON)')}</span>
            </div>
            <Link to="/app/privacy-data" className="font-semibold text-emerald-600 hover:underline">
              {t('download_json', 'Download JSON')}
            </Link>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>{t('account_credentials', 'Account Credentials & Verification')}</span>
            </div>
            <span className="text-slate-500">{t('protected_badge', 'HttpOnly Cookie Protected')}</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {t('account_deletion', 'Permanent Account Deletion')}
              </span>
            </div>
            <Link to="/app/privacy-data" className="font-semibold text-rose-600 hover:underline">
              {t('request_deletion', 'Request Deletion')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
