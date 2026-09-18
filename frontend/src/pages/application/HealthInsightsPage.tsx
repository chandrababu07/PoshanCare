import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Activity,
  Droplets,
  Utensils,
  Target,
  Scale,
  Sparkles,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import healthInsightsService, {
  HealthInsightsResponse,
  RuleBasedInsight,
  PrioritizedAction,
  CorrelationInsight,
} from '../../services/healthInsightsService';

export const HealthInsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<string>('7d');
  const [loading, setLoading] = useState<boolean>(true);
  const [insightsData, setInsightsData] = useState<HealthInsightsResponse | null>(null);

  const fetchInsights = async (selectedPeriod: string) => {
    setLoading(true);
    const data = await healthInsightsService.getHealthInsights(selectedPeriod);
    setInsightsData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Medium
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Normal
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'nutrition':
        return <Utensils className="w-5 h-5 text-primary" />;
      case 'hydration':
        return <Droplets className="w-5 h-5 text-tertiary" />;
      case 'activity':
        return <Activity className="w-5 h-5 text-secondary" />;
      case 'weight':
        return <Scale className="w-5 h-5 text-primary" />;
      case 'goals':
        return <Target className="w-5 h-5 text-primary" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  const getTrendIcon = (status: string) => {
    switch (status) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-error" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-outline" />;
      default:
        return <HelpCircle className="w-4 h-4 text-outline" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-low shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-primary-container text-on-primary-container">
              <Lightbulb className="w-6 h-6 text-primary-fixed" />
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Health Insights & Action Center
            </h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Understand your health patterns, analyze evidence-based trends, and decide what to focus on next.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-surface-container-low p-1.5 rounded-xl self-start md:self-auto">
          {['7d', '14d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                period === p
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-surface-container-lowest rounded-2xl border border-surface-container-low">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="font-body-md text-body-md text-on-surface-variant">
            Analyzing real health telemetry...
          </p>
        </div>
      ) : !insightsData ? (
        <div className="p-8 bg-surface-container-lowest rounded-2xl border border-surface-container-low text-center">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">
            Unable to load health insights
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Please check backend service availability or try again.
          </p>
        </div>
      ) : (
        <>
          {/* SECTION 1 — Health Snapshot */}
          <section className="space-y-4">
            <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
              Health Snapshot ({period.toUpperCase()})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Nutrition Snapshot Card */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary-container">
                        <Utensils className="w-5 h-5 text-primary-fixed" />
                      </div>
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        Nutrition
                      </span>
                    </div>
                    {insightsData.data_availability.has_nutrition_data ? (
                      <span className="px-2 py-0.5 rounded-md bg-tertiary-container text-on-tertiary font-label-sm text-label-sm">
                        Active Log
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                        No Data
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    {insightsData.summary.nutrition.avg_value !== null ? (
                      <div>
                        <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                          {insightsData.summary.nutrition.avg_value}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                          {insightsData.summary.nutrition.unit} / day avg
                        </span>
                      </div>
                    ) : (
                      <p className="font-body-md text-body-md text-outline italic">
                        No meals logged in selected period
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-container-low flex justify-between items-center text-label-md font-label-md text-on-surface-variant">
                  <span>Logged Days: {insightsData.summary.nutrition.logged_days}</span>
                  <span>Consistency: {insightsData.summary.nutrition.consistency_pct}%</span>
                </div>
              </div>

              {/* Hydration Snapshot Card */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-tertiary-container">
                        <Droplets className="w-5 h-5 text-on-tertiary" />
                      </div>
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        Hydration
                      </span>
                    </div>
                    {insightsData.data_availability.has_hydration_data ? (
                      <span className="px-2 py-0.5 rounded-md bg-tertiary-container text-on-tertiary font-label-sm text-label-sm">
                        Active Log
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                        No Data
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    {insightsData.summary.hydration.avg_value !== null ? (
                      <div>
                        <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                          {insightsData.summary.hydration.avg_value}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                          {insightsData.summary.hydration.unit} / day avg
                        </span>
                      </div>
                    ) : (
                      <p className="font-body-md text-body-md text-outline italic">
                        No water logged in selected period
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-container-low flex justify-between items-center text-label-md font-label-md text-on-surface-variant">
                  <span>Logged Days: {insightsData.summary.hydration.logged_days}</span>
                  <span>Consistency: {insightsData.summary.hydration.consistency_pct}%</span>
                </div>
              </div>

              {/* Activity Snapshot Card */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-secondary-container">
                        <Activity className="w-5 h-5 text-on-secondary-container" />
                      </div>
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        Activity
                      </span>
                    </div>
                    {insightsData.data_availability.has_activity_data ? (
                      <span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                        Active Log
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                        No Data
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    {insightsData.summary.activity.avg_value !== null ? (
                      <div>
                        <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                          {insightsData.summary.activity.avg_value.toLocaleString()}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                          {insightsData.summary.activity.unit} / day avg
                        </span>
                      </div>
                    ) : (
                      <p className="font-body-md text-body-md text-outline italic">
                        No activity logged in selected period
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-container-low flex justify-between items-center text-label-md font-label-md text-on-surface-variant">
                  <span>Logged Days: {insightsData.summary.activity.logged_days}</span>
                  <span>Consistency: {insightsData.summary.activity.consistency_pct}%</span>
                </div>
              </div>

              {/* Health Goals Snapshot Card */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary-container">
                        <Target className="w-5 h-5 text-primary-fixed" />
                      </div>
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        Health Goals
                      </span>
                    </div>
                    {insightsData.data_availability.has_goal_data ? (
                      <span className="px-2 py-0.5 rounded-md bg-primary-container text-on-primary-container font-label-sm text-label-sm">
                        Configured
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                        No Goals
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span className="font-numeric-metric text-numeric-metric text-on-surface font-bold">
                      {insightsData.summary.goals.active}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                      Active Goals
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-container-low flex justify-between items-center text-label-md font-label-md text-on-surface-variant">
                  <span>Completed: {insightsData.summary.goals.completed}</span>
                  <span>Total: {insightsData.summary.goals.total}</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4 — What To Do Next (Prioritized Action Center) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> What To Do Next (Prioritized Action Center)
              </h2>
              <span className="font-label-md text-label-md text-outline">
                {insightsData.actions.length} Recommended Actions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insightsData.actions.map((action: PrioritizedAction) => (
                <div
                  key={action.id}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col justify-between hover:border-primary-container transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {getPriorityBadge(action.priority)}
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                        {action.category}
                      </span>
                    </div>

                    <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-1">
                      {action.title}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {action.description}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(action.route)}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all"
                  >
                    <span>Execute Action</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2 — Trend Explorer */}
          <section className="space-y-4">
            <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
              Telemetry Trend Explorer ({period.toUpperCase()})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insightsData.trends.map((series) => (
                <div
                  key={series.metric}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(series.metric)}
                      <span className="font-title-md text-title-md text-on-surface font-semibold capitalize">
                        {series.metric}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low font-label-sm text-label-sm font-semibold">
                      {getTrendIcon(series.status)}
                      <span className="capitalize">{series.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {series.message}
                  </p>

                  {series.change_pct !== null && (
                    <div className="pt-2 border-t border-surface-container-low flex items-center justify-between text-label-sm font-label-sm">
                      <span className="text-outline">Net Change:</span>
                      <span className={series.change_pct >= 0 ? 'text-success font-semibold' : 'text-error font-semibold'}>
                        {series.change_pct >= 0 ? `+${series.change_pct}%` : `${series.change_pct}%`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3 — Key Insights */}
          <section className="space-y-4">
            <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
              Clinical & Observational Insights
            </h2>

            <div className="space-y-3">
              {insightsData.insights.map((insight: RuleBasedInsight) => (
                <div
                  key={insight.id}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-surface-container-low shrink-0 mt-1">
                      {getCategoryIcon(insight.category)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                          {insight.title}
                        </h3>
                        {getPriorityBadge(insight.priority)}
                      </div>

                      <p className="font-body-md text-body-md text-on-surface-variant">
                        {insight.message}
                      </p>

                      <p className="font-body-sm text-body-sm text-outline font-medium">
                        Evidence: {insight.evidence}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-surface-container-low">
                    <span className="font-label-md text-label-md text-primary font-semibold bg-primary-container px-3 py-1.5 rounded-xl block">
                      💡 Recommended: {insight.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5 — Patterns & Correlation Observations */}
          <section className="space-y-4">
            <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">
              Observed Patterns & Telemetry Relationships
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insightsData.correlations.map((corr: CorrelationInsight) => (
                <div
                  key={corr.id}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-low shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                      {corr.title}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm font-semibold capitalize">
                      {corr.strength.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="font-body-md text-body-md text-on-surface-variant">
                    "{corr.observation}"
                  </p>

                  <div className="pt-2 border-t border-surface-container-low flex justify-between items-center font-label-sm text-label-sm text-outline">
                    <span>Overlapping Days: {corr.overlapping_days}</span>
                    <span>{corr.is_statistically_valid ? 'Valid Pattern' : 'Insufficient Data'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HealthInsightsPage;
