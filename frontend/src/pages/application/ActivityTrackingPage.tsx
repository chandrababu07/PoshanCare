import React, { useEffect, useState } from 'react';
import {
  Activity,
  Footprints,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Award,
} from 'lucide-react';
import {
  fetchDailyActivity,
  fetchActivityHistory,
  upsertActivityLog,
  ActivityLogItem,
} from '../../services/activityService';
import { fetchUserProfile, BackendProfileResponse } from '../../services/profileService';

export const ActivityTrackingPage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [profile, setProfile] = useState<BackendProfileResponse | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogItem | null>(null);
  const [hasActivityData, setHasActivityData] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [activityLevel, setActivityLevel] = useState<string>('Moderately Active');
  const [stepsInput, setStepsInput] = useState<string>('');
  const [activeMinsInput, setActiveMinsInput] = useState<string>('');
  const [exerciseMinsInput, setExerciseMinsInput] = useState<string>('');
  const [activityTypeInput, setActivityTypeInput] = useState<string>('Walking');
  const [notesInput, setNotesInput] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // History State
  const [historyLogs, setHistoryLogs] = useState<ActivityLogItem[]>([]);
  const [historyAvgSteps, setHistoryAvgSteps] = useState<number | null>(null);

  const isOlderAdult = profile?.profile_type === 'older_adult';
  const isPediatric = profile?.profile_type === 'child' || profile?.profile_type === 'teen';

  const activityOptions = [
    { label: 'Sedentary (Minimal Movement)', value: 'Sedentary' },
    { label: 'Lightly Active (Daily Steps & Errands)', value: 'Lightly Active' },
    { label: 'Moderately Active (Moderate Exercise / 3-4 days)', value: 'Moderately Active' },
    { label: 'Very Active (Intense Exercise 6-7 days)', value: 'Very Active' },
    { label: 'Extremely Active (Athletic / Physical Job)', value: 'Extremely Active' },
  ];

  const commonActivityTypes = ['Walking', 'Running', 'Yoga', 'Cycling', 'Gym Workout', 'Swimming', 'Sports / Play'];

  const loadData = async (date: string) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const prof = await fetchUserProfile();
      if (prof) setProfile(prof);
    } catch {
      // Ignore profile load failure
    }

    try {
      const daily = await fetchDailyActivity(date);
      if (daily && daily.has_activity_data && daily.log) {
        setHasActivityData(true);
        setActivityLog(daily.log);
        setActivityLevel(daily.log.activity_level || 'Moderately Active');
        setStepsInput(daily.log.steps !== null && daily.log.steps !== undefined ? String(daily.log.steps) : '');
        setActiveMinsInput(daily.log.active_minutes !== null && daily.log.active_minutes !== undefined ? String(daily.log.active_minutes) : '');
        setExerciseMinsInput(daily.log.exercise_minutes !== null && daily.log.exercise_minutes !== undefined ? String(daily.log.exercise_minutes) : '');
        setActivityTypeInput(daily.log.activity_type || 'Walking');
        setNotesInput(daily.log.notes || '');
      } else {
        setHasActivityData(false);
        setActivityLog(null);
        setStepsInput('');
        setActiveMinsInput('');
        setExerciseMinsInput('');
        setNotesInput('');
      }
    } catch {
      setErrorMessage('Failed to load activity telemetry for the selected date.');
    }

    try {
      const history = await fetchActivityHistory('30d');
      if (history) {
        setHistoryLogs(history.logs);
        setHistoryAvgSteps(history.avg_steps);
      }
    } catch {
      // Ignore history fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    const stepsVal = stepsInput.trim() !== '' ? parseInt(stepsInput.trim(), 10) : undefined;
    const activeMinsVal = activeMinsInput.trim() !== '' ? parseInt(activeMinsInput.trim(), 10) : undefined;
    const exerciseMinsVal = exerciseMinsInput.trim() !== '' ? parseInt(exerciseMinsInput.trim(), 10) : undefined;

    if (stepsVal !== undefined && (isNaN(stepsVal) || stepsVal < 0)) {
      setErrorMessage('Step count cannot be negative.');
      setSaving(false);
      return;
    }

    if (activeMinsVal !== undefined && (isNaN(activeMinsVal) || activeMinsVal < 0)) {
      setErrorMessage('Active minutes cannot be negative.');
      setSaving(false);
      return;
    }

    const res = await upsertActivityLog({
      date: selectedDate,
      activity_level: activityLevel,
      steps: stepsVal,
      active_minutes: activeMinsVal,
      exercise_minutes: exerciseMinsVal,
      activity_type: activityTypeInput,
      notes: notesInput,
    });

    setSaving(false);

    if (res) {
      setSaveSuccess(true);
      setActivityLog(res);
      setHasActivityData(true);
      loadData(selectedDate);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setErrorMessage('Failed to save activity record. Please check input values.');
    }
  };

  return (
    <div className={`space-y-8 max-w-6xl mx-auto pb-12 ${isOlderAdult ? 'text-lg font-sans' : ''}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Activity className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isPediatric ? 'Active Play & Movement Tracking' : isOlderAdult ? 'Daily Mobility & Active Movement' : 'Activity & Telemetry Tracking'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isPediatric
                ? 'Record your daily steps, active play, and healthy energy movement.'
                : isOlderAdult
                ? 'Log your daily walking, step count, and light active exercises.'
                : 'Track daily step count, active duration, exercise, and physical telemetry.'}
            </p>
          </div>
        </div>

        {/* Date Selection */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white border-0 focus:outline-none pr-2 min-h-[44px]"
          />
        </div>
      </div>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Logging Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Footprints className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Log Activity for {selectedDate === todayStr ? 'Today' : selectedDate}</span>
            </h2>
            {hasActivityData && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                Telemetry Logged
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Activity telemetry record saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Step Count */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Daily Step Count</span>
                <span className="text-slate-400 font-normal lowercase">e.g., 6500</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="200000"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  placeholder="Enter steps (e.g. 7500)"
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                    isOlderAdult ? 'min-h-[48px]' : 'min-h-[44px]'
                  }`}
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">steps</span>
              </div>
            </div>

            {/* Active Minutes & Exercise Minutes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Active Minutes
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    value={activeMinsInput}
                    onChange={(e) => setActiveMinsInput(e.target.value)}
                    placeholder="e.g. 45"
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                      isOlderAdult ? 'min-h-[48px]' : 'min-h-[44px]'
                    }`}
                  />
                  <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">mins</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Exercise Minutes
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    value={exerciseMinsInput}
                    onChange={(e) => setExerciseMinsInput(e.target.value)}
                    placeholder="e.g. 30"
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                      isOlderAdult ? 'min-h-[48px]' : 'min-h-[44px]'
                    }`}
                  />
                  <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">mins</span>
                </div>
              </div>
            </div>

            {/* Primary Activity Type Chips & Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Primary Activity Type
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {commonActivityTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActivityTypeInput(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      activityTypeInput === type
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={activityTypeInput}
                onChange={(e) => setActivityTypeInput(e.target.value)}
                placeholder="Or type custom activity name..."
                className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                  isOlderAdult ? 'min-h-[48px]' : 'min-h-[44px]'
                }`}
              />
            </div>

            {/* Baseline Activity Level */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Daily Activity Category
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                  isOlderAdult ? 'min-h-[48px]' : 'min-h-[44px]'
                }`}
              >
                {activityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Notes / Remarks
              </label>
              <input
                type="text"
                maxLength={255}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Optional notes e.g., Evening park walk with family"
                className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${
                  isOlderAdult ? 'min-h-[48px]' : 'min-h-[44px]'
                }`}
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 ${
                isOlderAdult ? 'min-h-[52px] text-base' : 'min-h-[48px]'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Activity Telemetry</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Today's Summary & History (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Today's Activity Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Today's Telemetry Overview</span>
            </h2>

            {loading ? (
              <div className="text-xs text-slate-400 p-4">Loading activity summary...</div>
            ) : !hasActivityData ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2">
                <Activity className="w-8 h-8 text-slate-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Activity hasn't been logged today</span>
                <p className="text-xs text-slate-500">
                  Enter your steps or movement minutes above to build your daily health telemetry.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Steps Logged</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {activityLog?.steps !== null && activityLog?.steps !== undefined
                      ? activityLog.steps.toLocaleString()
                      : 'Not set'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Active Duration</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {activityLog?.active_minutes !== null && activityLog?.active_minutes !== undefined
                      ? `${activityLog.active_minutes} mins`
                      : 'Not set'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 30-Day Activity History */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>30-Day Activity History</span>
              </h2>
              {historyAvgSteps !== null && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Avg: {Math.round(historyAvgSteps).toLocaleString()} steps
                </span>
              )}
            </div>

            {historyLogs.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                As you log your daily activity, your historical step velocity and active trends will appear here.
              </p>
            ) : (
              <div className="flex flex-col gap-2 divide-y divide-slate-100 dark:divide-slate-800">
                {historyLogs.map((log) => (
                  <div key={log.id} className="pt-2.5 flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{log.date}</span>
                      <span className="text-slate-500">{log.activity_type || 'General Movement'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {log.steps !== null && log.steps !== undefined ? `${log.steps.toLocaleString()} steps` : '—'}
                      </span>
                      {log.active_minutes !== undefined && log.active_minutes !== null && (
                        <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {log.active_minutes} active mins
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTrackingPage;
