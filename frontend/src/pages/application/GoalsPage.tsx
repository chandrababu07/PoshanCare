import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  Clock,
  Droplets,
  Zap,
  Utensils,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  RefreshCw,
  Heart,
} from 'lucide-react';
import {
  goalsService,
  GoalDashboardResponse,
  GoalResponse,
} from '../../services/goalsService';
import { fetchUserProfile, BackendProfileResponse } from '../../services/profileService';

const GOAL_TYPES = [
  { id: 'hydration', label: 'Hydration Intake', defaultUnit: 'ml', defaultTarget: 2500, icon: Droplets, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200' },
  { id: 'activity', label: 'Physical Activity', defaultUnit: 'min', defaultTarget: 150, icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
  { id: 'meal_consistency', label: 'Meal Logging Routine', defaultUnit: 'days/week', defaultTarget: 5, icon: Utensils, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
  { id: 'protein', label: 'Protein RDA Target', defaultUnit: 'g', defaultTarget: 60, icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200' },
  { id: 'weight_tracking', label: 'Weight Telemetry Tracking', defaultUnit: 'logs/month', defaultTarget: 4, icon: Scale, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
  { id: 'custom', label: 'Custom Health Goal', defaultUnit: 'count', defaultTarget: 1, icon: Target, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' },
];

export const GoalsPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<GoalDashboardResponse | null>(null);
  const [historyGoals, setHistoryGoals] = useState<GoalResponse[]>([]);
  const [profile, setProfile] = useState<BackendProfileResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Goal Creation Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [goalType, setGoalType] = useState<string>('hydration');
  const [title, setTitle] = useState<string>('Daily Hydration Target');
  const [description, setDescription] = useState<string>('Log water intake consistently every day');
  const [targetValue, setTargetValue] = useState<number>(2500);
  const [unit, setUnit] = useState<string>('ml');
  const [frequency, setFrequency] = useState<string>('daily');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    const [dashData, histData, profData] = await Promise.all([
      goalsService.getGoalsDashboard(),
      goalsService.getGoals('completed'),
      fetchUserProfile(),
    ]);
    setDashboard(dashData);
    setHistoryGoals(histData);
    setProfile(profData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectGoalType = (typeId: string) => {
    const selected = GOAL_TYPES.find((t) => t.id === typeId);
    if (!selected) return;
    setGoalType(typeId);
    setUnit(selected.defaultUnit);
    setTargetValue(selected.defaultTarget);
    if (typeId === 'hydration') {
      setTitle('Daily Hydration Target');
      setDescription('Maintain optimal water intake for cognitive and physical endurance');
    } else if (typeId === 'activity') {
      setTitle('Weekly Active Minutes');
      setDescription('Engage in physical movement or active play');
    } else if (typeId === 'meal_consistency') {
      setTitle('Daily Food Diary Routine');
      setDescription('Log food diary entries at least 5 days a week');
    } else if (typeId === 'protein') {
      setTitle('Daily Protein Intake Goal');
      setDescription('Meet baseline RDA protein targets for muscle and growth');
    } else if (typeId === 'weight_tracking') {
      setTitle('Regular Weight Telemetry');
      setDescription('Log weight entries to track moving averages and progress trends');
    } else {
      setTitle('Personal Wellness Habit');
      setDescription('');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const res = await goalsService.createGoal({
      goal_type: goalType,
      title,
      description,
      target_value: Number(targetValue),
      unit,
      frequency,
    });

    setSubmitting(false);
    if (res.goal) {
      setShowCreateModal(false);
      showToast('Health goal created successfully!');
      loadData();
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleCompleteGoal = async (goalId: number) => {
    const res = await goalsService.completeGoal(goalId);
    if (res) {
      showToast('Goal completed! Great achievement 🎉');
      loadData();
    }
  };

  const handleArchiveGoal = async (goalId: number) => {
    const res = await goalsService.deleteGoal(goalId);
    if (res) {
      showToast('Goal archived.');
      loadData();
    }
  };

  const profileType = profile?.profile_type || 'adult';
  const isChildOrTeen = profileType === 'child' || profileType === 'teen';

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-primary text-on-primary rounded-xl shadow-lg animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-body-md text-body-md">{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              My Goals & Adaptive Coaching
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Real Telemetry
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Track real progress from database telemetry, receive explainable insights, and build sustainable habits.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Goal
        </button>
      </div>

      {/* Persona Safety Guidance Banner */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-low flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-title-sm text-title-sm text-on-surface capitalize">
                {profileType.replace('_', ' ')} Profile Engine Active
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {isChildOrTeen
                ? 'Pediatric safety protection active: Weight-loss and restriction targets are disabled to prioritize growth and nourishment.'
                : profileType === 'older_adult'
                ? 'Senior health focus: High-protein, hydration, and sarcopenia prevention guidance prioritized.'
                : 'Balanced goals mapped against ICMR-NIN 2024 recommended dietary allowances.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Adaptive Coaching Insights */}
      {dashboard?.coaching_insights && dashboard.coaching_insights.length > 0 && (
        <div className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container-low shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-title-md text-title-md text-on-surface">Adaptive Clinical Coaching</h2>
            </div>
            <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
              Explainable & Data-Driven
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.coaching_insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  insight.priority === 'high'
                    ? 'bg-amber-500/10 border-amber-200 dark:border-amber-900/50'
                    : insight.priority === 'medium'
                    ? 'bg-primary-container/30 border-primary-container'
                    : 'bg-surface-container-low/50 border-surface-container-low'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {insight.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        insight.priority === 'high'
                          ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                          : insight.priority === 'medium'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {insight.priority} priority
                    </span>
                  </div>
                  <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                    {insight.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {insight.message}
                  </p>
                </div>

                {insight.suggested_action && insight.suggested_route && (
                  <Link
                    to={insight.suggested_route}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1"
                  >
                    <span>{insight.suggested_action}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: My Active Goals Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-title-md text-title-md text-on-surface">Active Health Goals</h2>
          <span className="text-xs text-on-surface-variant font-medium">
            {dashboard ? `${dashboard.active_goals.length} Active Goals` : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-surface-container-low animate-pulse">
            Calculating real database telemetry progress...
          </div>
        ) : !dashboard || dashboard.active_goals.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-surface-container-low space-y-4">
            <Target className="w-12 h-12 text-on-surface-variant mx-auto stroke-1" />
            <div>
              <h3 className="font-title-md text-title-md text-on-surface">No Active Goals Configured</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">
                Set personalized health, hydration, activity, or protein goals to track real telemetry progress over time.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md inline-flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboard.active_goals.map((gProg) => {
              const g = gProg.goal;
              const typeMeta = GOAL_TYPES.find((t) => t.id === g.goal_type) || GOAL_TYPES[0];
              const Icon = typeMeta.icon;

              return (
                <div
                  key={g.id}
                  className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Goal Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${typeMeta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {g.goal_type.replace('_', ' ')}
                          </span>
                          <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                            {g.title}
                          </h3>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase">
                        {g.status}
                      </span>
                    </div>

                    {g.description && (
                      <p className="font-body-xs text-body-xs text-on-surface-variant">
                        {g.description}
                      </p>
                    )}

                    {/* Progress Metrics & Visualization */}
                    <div className="space-y-2 p-3 rounded-lg bg-surface-container-low/40 border border-surface-container-low">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant font-medium">Real Progress</span>
                        <span className="font-bold text-on-surface">
                          {gProg.has_data && gProg.current_value !== null
                            ? `${gProg.current_value} / ${gProg.target_value} ${gProg.unit}`
                            : `Target: ${gProg.target_value} ${gProg.unit}`}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{
                            width: `${gProg.progress_percentage || 0}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span>{gProg.message}</span>
                        {gProg.progress_percentage !== null && gProg.progress_percentage !== undefined && (
                          <span className="font-bold text-primary">
                            {Math.round(gProg.progress_percentage)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-surface-container-low flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCompleteGoal(g.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete Goal
                    </button>
                    <button
                      onClick={() => handleArchiveGoal(g.id)}
                      className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-xs font-medium transition-colors"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Goal History */}
      {historyGoals.length > 0 && (
        <div className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container-low shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-on-surface-variant" />
            <h2 className="font-title-md text-title-md text-on-surface">Completed Goals History</h2>
          </div>

          <div className="divide-y divide-surface-container-low">
            {historyGoals.map((hG) => (
              <div key={hG.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-body-sm font-semibold text-on-surface">{hG.title}</div>
                    <div className="font-body-xs text-body-xs text-on-surface-variant">
                      Target: {hG.target_value} {hG.unit} • Completed
                    </div>
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded">
                  {hG.start_date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-low space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-title-md text-title-md text-on-surface">Create Personal Health Goal</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-error-container/20 border border-error-container text-error text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isChildOrTeen && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-200 text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Pediatric Safety Active: Goals for young users are restricted to growth, hydration, active play, and meal routines.
                </span>
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-4">
              {/* Goal Type selector */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5 uppercase">
                  Goal Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GOAL_TYPES.map((gt) => (
                    <button
                      key={gt.id}
                      type="button"
                      onClick={() => handleSelectGoalType(gt.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        goalType === gt.id
                          ? 'border-primary bg-primary-container/30 ring-1 ring-primary'
                          : 'border-surface-container-low hover:border-primary/40 bg-surface-container-low/30'
                      }`}
                    >
                      <gt.icon className="w-4 h-4 text-primary mb-1" />
                      <span className="text-xs font-semibold text-on-surface truncate">{gt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1 uppercase">
                  Description / Clinical Detail
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Target & Unit & Frequency */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase">Target</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0.1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1 uppercase">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-surface-container rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold inline-flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Health Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
