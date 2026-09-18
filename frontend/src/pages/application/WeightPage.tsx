import React, { useEffect, useState } from 'react';
import { PlusCircle, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseApiError } from '../../utils/apiErrors';
import { WeightLogEntry } from '../../data/mockWeight';
import {
  addWeightLogToApi,
  fetchWeightSummaryFromApi,
  mapBackendWeightLogToFrontend,
} from '../../services/weightService';

export const WeightPage: React.FC = () => {
  const [logs, setLogs] = useState<WeightLogEntry[]>([]);
  const [summary, setSummary] = useState({
    currentWeight: 0,
    targetWeight: 0,
    startWeight: 0,
    netAccretion: 0,
    weeklyVelocity: 0,
    progressPct: 0,
    daysTracked: 0,
  });
  const [newWeight, setNewWeight] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newNote, setNewNote] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadWeightData() {
      const res = await fetchWeightSummaryFromApi();
      if (isMounted && res) {
        setLogs(res.logs.map(mapBackendWeightLogToFrontend));
        setSummary({
          currentWeight: res.current_weight,
          targetWeight: res.target_weight,
          startWeight: res.start_weight,
          netAccretion: res.net_change,
          weeklyVelocity: res.weekly_velocity,
          progressPct: res.progress_pct,
          daysTracked: res.days_tracked,
        });
      }
    }
    loadWeightData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    const wNum = parseFloat(newWeight);
    const apiRes = await addWeightLogToApi({
      date: newDate,
      weight_kg: wNum,
      note: newNote || undefined,
    });

    if (apiRes) {
      setToastMessage('Weight log saved successfully!');
      setTimeout(() => setToastMessage(null), 3500);
      const refreshedSummary = await fetchWeightSummaryFromApi();
      if (refreshedSummary) {
        setLogs(refreshedSummary.logs.map(mapBackendWeightLogToFrontend));
        setSummary({
          currentWeight: refreshedSummary.current_weight,
          targetWeight: refreshedSummary.target_weight,
          startWeight: refreshedSummary.start_weight,
          netAccretion: refreshedSummary.net_change,
          weeklyVelocity: refreshedSummary.weekly_velocity,
          progressPct: refreshedSummary.progress_pct,
          daysTracked: refreshedSummary.days_tracked,
        });
      }
    } else {
      const err = parseApiError(new Error('Network error logging weight'));
      setErrorMessage(err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    }
    setNewNote('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 shadow-xs"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Weight & Body Composition Trajectory
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Track daily body mass trendlines, 7-day moving averages, and caloric surplus correlation.
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Weight */}
        <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Current Weight
            </span>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed font-semibold">
              {summary.currentWeight > 0
                ? (summary.netAccretion >= 0 ? `+${summary.netAccretion} kg` : `${summary.netAccretion} kg`)
                : 'No entries'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                {summary.currentWeight > 0 ? summary.currentWeight : '—'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              {summary.currentWeight > 0 ? `${summary.progressPct}% of goal path` : 'Awaiting first weigh-in'}
            </span>
          </div>
        </div>

        {/* Target Weight */}
        <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Target Weight
            </span>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed-variant font-semibold">
              Target Goal
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                {summary.targetWeight > 0 ? summary.targetWeight : '—'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              {summary.currentWeight > 0 && summary.targetWeight > 0
                ? `${Math.abs(summary.targetWeight - summary.currentWeight).toFixed(1)} kg delta to target`
                : 'Target set in profile'}
            </span>
          </div>
        </div>

        {/* Net Accretion */}
        <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Net Mass Change
            </span>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-primary font-semibold">
              {summary.daysTracked} Days Tracked
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-primary font-bold">
                {summary.currentWeight > 0
                  ? (summary.netAccretion >= 0 ? `+${summary.netAccretion}` : summary.netAccretion)
                  : '—'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              {summary.startWeight > 0 ? `Start: ${summary.startWeight} kg` : 'Baseline pending'}
            </span>
          </div>
        </div>

        {/* Weekly Velocity */}
        <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Weekly Velocity
            </span>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed font-semibold">
              {summary.daysTracked >= 7 ? 'Observed' : 'Pending'}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                {summary.daysTracked >= 7
                  ? (summary.weeklyVelocity >= 0 ? `+${summary.weeklyVelocity}` : summary.weeklyVelocity)
                  : '—'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg/wk</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              {summary.daysTracked >= 7 ? '7-day moving average rate' : 'Requires 7+ days of logs'}
            </span>
          </div>
        </div>
      </div>

      {/* Log Weight Entry Form Widget */}
      <form onSubmit={handleAddLog} className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-y-1.5">
            <label className="font-label-md text-label-md text-on-surface">Log Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg border border-surface-container focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-y-1.5">
            <label className="font-label-md text-label-md text-on-surface">Measured Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="e.g. 56.4"
              className="h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg border border-surface-container focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-y-1.5">
            <label className="font-label-md text-label-md text-on-surface">Notes / Context (Optional)</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Fasted morning weigh-in..."
              className="h-10 px-3 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg border border-surface-container focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          className="h-10 px-5 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Entry</span>
        </button>
      </form>

      {/* SVG Weight Trajectory Line Chart */}
      <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface font-semibold">
              Body Weight Trajectory &amp; Milestone Path
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Continuous log with 7-day moving average overlay
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-label-sm text-label-sm text-on-surface-variant">
            <div className="flex items-center gap-x-2">
              <span className="w-3 h-3 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
              </span>
              <span>Daily Log (kg)</span>
            </div>
            <div className="flex items-center gap-x-2">
              <span className="w-4 h-1 rounded-full bg-primary"></span>
              <span className="font-medium text-on-surface">7-Day Moving Avg</span>
            </div>
            <div className="flex items-center gap-x-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-secondary"></span>
              <span>Target ({summary.targetWeight > 0 ? `${summary.targetWeight} kg` : 'Target'})</span>
            </div>
          </div>
        </div>

        {/* Chart View */}
        {logs.length === 0 ? (
          <div className="py-16 px-6 rounded-xl bg-surface-container-low/40 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
            <TrendingUp className="w-10 h-10 opacity-30 text-primary" />
            <p className="font-title-md text-title-md font-semibold text-on-surface">No Weight Data Recorded Yet</p>
            <p className="font-body-sm text-body-sm max-w-md text-on-surface-variant">
              Log your body mass measurement above to unlock your personalized weight trajectory, moving averages, and goal milestone tracking.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto relative">
            <div className="min-w-[760px] h-[280px] w-full relative flex flex-col justify-between select-none p-4 bg-surface-container-low/30 rounded-xl">
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
                <span>Earliest: {logs[0]?.date} ({logs[0]?.weight} kg)</span>
                <span>Latest: {logs[logs.length - 1]?.date} ({logs[logs.length - 1]?.weight} kg)</span>
              </div>
              <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-4">
                {logs.slice(-14).map((l) => {
                  const minW = Math.min(...logs.map((item) => item.weight), summary.targetWeight || 50) - 2;
                  const maxW = Math.max(...logs.map((item) => item.weight), summary.targetWeight || 70) + 2;
                  const heightPct = Math.max(10, Math.min(100, Math.round(((l.weight - minW) / Math.max(1, maxW - minW)) * 100)));
                  return (
                    <div key={l.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <span className="text-[11px] font-bold text-primary group-hover:scale-110 transition-transform">
                        {l.weight}
                      </span>
                      <div
                        className="w-full max-w-[28px] bg-primary-container hover:bg-primary rounded-t-md transition-all cursor-pointer"
                        style={{ height: `${heightPct * 1.8}px` }}
                        title={`${l.date}: ${l.weight} kg (MA: ${l.movingAverage} kg)`}
                      />
                      <span className="text-[10px] text-on-surface-variant truncate max-w-[48px]">
                        {l.date.split(',')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dual-Grid Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calorie Intake vs Velocity Correlation */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col gap-y-1 mb-5">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                Calorie Intake vs. Weight Velocity
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full">
                Observational
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Weekly average energy intake compared to measured net mass accretion.
            </p>
          </div>

          <div className="flex flex-col gap-y-4">
            <div className="p-8 rounded-lg bg-surface-container-low/40 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                {logs.length >= 14 ? 'Calorie Correlation Engine Active' : 'Insufficient Multi-Week Logs'}
              </span>
              <p className="font-body-sm text-body-sm max-w-md">
                {logs.length >= 14
                  ? `Observational trend calculated over ${logs.length} logged entries. Net trajectory velocity is currently ${summary.weeklyVelocity >= 0 ? '+' : ''}${summary.weeklyVelocity} kg/week.`
                  : 'Log meals and body measurements across at least two consecutive weeks to generate your observational intake-to-velocity correlation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Anthropometric Logs Table */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-4">
            Recent Log Entries ({logs.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">7-Day Avg</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant">
                      No weight entries logged yet. Record your first weigh-in above.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-on-surface">{log.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-primary">{log.weight} kg</td>
                      <td className="py-2.5 px-3 text-on-surface-variant">{log.movingAverage} kg</td>
                      <td className="py-2.5 px-3 text-on-surface-variant truncate max-w-[120px]">{log.note || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightPage;
