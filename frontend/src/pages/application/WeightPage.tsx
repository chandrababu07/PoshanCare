import React, { useEffect, useState } from 'react';
import { PlusCircle, Award, TrendingUp } from 'lucide-react';
import {
  MOCK_WEIGHT_SUMMARY,
  MOCK_WEIGHT_LOGS,
  MOCK_WEEKLY_CORRELATION,
  WeightLogEntry,
} from '../../data/mockWeight';
import {
  addWeightLogToApi,
  fetchWeightSummaryFromApi,
  mapBackendWeightLogToFrontend,
} from '../../services/weightService';

export const WeightPage: React.FC = () => {
  const [logs, setLogs] = useState<WeightLogEntry[]>(MOCK_WEIGHT_LOGS);
  const [summary, setSummary] = useState({
    currentWeight: MOCK_WEIGHT_SUMMARY.currentWeight,
    targetWeight: MOCK_WEIGHT_SUMMARY.targetWeight,
    startWeight: MOCK_WEIGHT_SUMMARY.startWeight,
    netAccretion: MOCK_WEIGHT_SUMMARY.netAccretion,
    weeklyVelocity: MOCK_WEIGHT_SUMMARY.weeklyVelocity,
    progressPct: MOCK_WEIGHT_SUMMARY.progressPct,
    daysTracked: MOCK_WEIGHT_SUMMARY.daysTracked,
  });
  const [newWeight, setNewWeight] = useState<string>('56.5');
  const [newDate, setNewDate] = useState<string>('2026-09-06');
  const [newNote, setNewNote] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadWeightData() {
      const res = await fetchWeightSummaryFromApi();
      if (isMounted && res && res.logs.length > 0) {
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
      // Local fallback
      const entry: WeightLogEntry = {
        id: `w-${Date.now()}`,
        date: newDate,
        weight: wNum,
        movingAverage: parseFloat(((wNum + 56.3) / 2).toFixed(1)),
        note: newNote || 'Manual local entry',
      };
      setLogs([entry, ...logs]);
    }
    setNewNote('');
  };

  return (
    <div className="space-y-8 pb-12">
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
              {summary.netAccretion >= 0 ? `+${summary.netAccretion} kg` : `${summary.netAccretion} kg`}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                {summary.currentWeight}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              {summary.progressPct}% of hypertrophy path
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
              Lean Mass Focus
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                {summary.targetWeight}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              {Math.abs(summary.targetWeight - summary.currentWeight).toFixed(1)} kg remaining projection
            </span>
          </div>
        </div>

        {/* Net Accretion */}
        <div className="p-5 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Net Mass Accretion
            </span>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-primary font-semibold">
              {summary.daysTracked} Days
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-primary font-bold">
                {summary.netAccretion >= 0 ? `+${summary.netAccretion}` : summary.netAccretion}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              Start: {summary.startWeight} kg
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
              On Pace
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-x-1">
              <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                {summary.weeklyVelocity >= 0 ? `+${summary.weeklyVelocity}` : summary.weeklyVelocity}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kg/wk</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              Target: +0.25–0.35 kg/wk
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
              placeholder="56.4"
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
              Body Weight Trajectory & Milestone Path
            </h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              30-day continuous log with 7-day moving average overlay
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
              <span>Target Trajectory (68 kg)</span>
            </div>
          </div>
        </div>

        {/* SVG Canvas Container */}
        <div className="w-full overflow-x-auto relative">
          <div className="min-w-[760px] h-[340px] w-full relative flex flex-col justify-between select-none">
            {/* Milestone Flag */}
            <div className="absolute left-[48%] top-[148px] -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center pointer-events-none">
              <div className="px-2.5 py-1 rounded-md bg-primary text-on-primary font-label-sm text-label-sm shadow-md flex items-center gap-x-1">
                <Award className="w-3.5 h-3.5 text-primary-fixed" />
                <span>Milestone 1: 55.0 kg reached (Oct 10)</span>
              </div>
              <div className="w-0.5 h-5 bg-primary"></div>
            </div>

            {/* Today Active Marker */}
            <div className="absolute right-[3%] top-[98px] -translate-x-1/2 -translate-y-full z-10 flex flex-col items-center pointer-events-none">
              <div className="px-2 py-0.5 rounded bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm shadow-md">
                Today: 56.4 kg
              </div>
              <div className="w-0.5 h-3 bg-inverse-surface"></div>
            </div>

            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 960 300">
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#065f46" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#065f46" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="targetBandGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fe932c" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#fe932c" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line stroke="#e7eeff" strokeDasharray="4 4" strokeWidth="1" x1="45" x2="940" y1="20" y2="20" />
              <text fill="#6f7973" fontSize="11" textAnchor="end" x="36" y="24">58.0</text>

              <line stroke="#e7eeff" strokeDasharray="4 4" strokeWidth="1" x1="45" x2="940" y1="75" y2="75" />
              <text fill="#6f7973" fontSize="11" textAnchor="end" x="36" y="79">57.0</text>

              <line stroke="#e7eeff" strokeDasharray="4 4" strokeWidth="1" x1="45" x2="940" y1="130" y2="130" />
              <text fill="#6f7973" fontSize="11" textAnchor="end" x="36" y="134">56.0</text>

              <line stroke="#e7eeff" strokeDasharray="4 4" strokeWidth="1" x1="45" x2="940" y1="185" y2="185" />
              <text fill="#6f7973" fontSize="11" textAnchor="end" x="36" y="189">55.0</text>

              <line stroke="#e7eeff" strokeWidth="1" x1="45" x2="940" y1="240" y2="240" />
              <text fill="#6f7973" fontSize="11" textAnchor="end" x="36" y="244">54.0</text>

              {/* Target band */}
              <polygon fill="url(#targetBandGradient)" points="45,210 940,90 940,135 45,230" />

              {/* Area fill */}
              <path
                d="M 50 205 C 150 198, 250 185, 350 178 C 450 170, 550 148, 650 138 C 750 130, 850 118, 930 112 L 930 240 L 50 240 Z"
                fill="url(#areaGradient)"
              />

              {/* Trajectory planned line */}
              <line opacity="0.8" stroke="#d97706" strokeDasharray="6 4" strokeWidth="2" x1="50" x2="930" y1="215" y2="118" />

              {/* 7-Day Moving average curve */}
              <path
                d="M 50 205 C 150 198, 250 185, 350 178 C 450 170, 550 148, 650 138 C 750 130, 850 118, 930 112"
                fill="none"
                stroke="#004532"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />

              {/* Daily points hairline */}
              <path
                d="M 50,200 L 80,195 L 110,210 L 140,190 L 170,185 L 200,195 L 230,180 L 260,172 L 290,182 L 320,170 L 350,175 L 380,165 L 410,160 L 440,170 L 470,155 L 500,150 L 530,162 L 560,145 L 590,140 L 620,148 L 650,132 L 680,128 L 710,135 L 740,122 L 770,120 L 800,128 L 830,115 L 860,122 L 890,118 L 930,105"
                fill="none"
                stroke="#6f7973"
                strokeDasharray="2 2"
                strokeOpacity="0.35"
                strokeWidth="1.2"
              />

              {/* Points */}
              <g fill="#ffffff" stroke="#6f7973" strokeWidth="1.5">
                <circle cx="50" cy="200" r="3" />
                <circle cx="260" cy="172" r="3" />
                <circle cx="470" cy="155" fill="#004532" r="4.5" stroke="#ffffff" strokeWidth="2" />
                <circle cx="710" cy="135" r="3" />
                <circle cx="930" cy="105" fill="#004532" r="5" stroke="#ffffff" strokeWidth="2.5" />
              </g>

              {/* X Axis Labels */}
              <text fill="#6f7973" fontSize="11" textAnchor="middle" x="50" y="266">Sep 25</text>
              <text fill="#6f7973" fontSize="11" textAnchor="middle" x="260" y="266">Oct 02</text>
              <text fill="#6f7973" fontSize="11" textAnchor="middle" x="470" y="266">Oct 09</text>
              <text fill="#6f7973" fontSize="11" textAnchor="middle" x="710" y="266">Oct 16</text>
              <text fill="#111c2d" fontSize="11" fontWeight="600" textAnchor="middle" x="930" y="266">Oct 24 (Today)</text>
            </svg>
          </div>
        </div>

        {/* Quick Context Footnote */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-surface-container-low rounded-lg">
          <div className="flex items-center gap-x-2 text-body-sm font-body-sm text-on-surface">
            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Analysis:</strong> Daily variance (+0.4 kg on Oct 22) aligns with higher evening sodium intake (sambar dal). True baseline velocity remains on pace.
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-outline shrink-0">Updated 42m ago</span>
        </div>
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
                4-Week Window
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Weekly average energy intake compared to measured net mass accretion.
            </p>
          </div>

          <div className="flex flex-col gap-y-4">
            {MOCK_WEEKLY_CORRELATION.map((week) => (
              <div key={week.week} className="flex flex-col gap-y-1.5 p-3 rounded-lg bg-surface-container-low/50">
                <div className="flex items-center justify-between font-label-md text-label-md">
                  <span className="text-on-surface font-semibold">{week.week}</span>
                  <div className="flex items-center gap-x-3 text-body-sm font-body-sm">
                    <span className="text-on-surface-variant">{week.avgCalories} kcal/day avg</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-medium">
                      {week.weightDelta}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                  <div className="bg-secondary-container h-full" style={{ width: `${week.pct}%` }}></div>
                </div>
              </div>
            ))}
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
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-on-surface">{log.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-primary">{log.weight} kg</td>
                    <td className="py-2.5 px-3 text-on-surface-variant">{log.movingAverage} kg</td>
                    <td className="py-2.5 px-3 text-on-surface-variant truncate max-w-[120px]">{log.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightPage;
