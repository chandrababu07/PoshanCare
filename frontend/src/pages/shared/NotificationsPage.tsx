import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Sliders,
  Droplets,
  Utensils,
  Activity,
  Target,
  Scale,
  Sparkles,
  BarChart3,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  notificationService,
  HealthNotification,
} from '../../services/notificationService';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<HealthNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [filterTab, setFilterTab] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [generateMessage, setGenerateMessage] = useState<string>('');

  const loadNotificationsData = async () => {
    setLoading(true);
    setError(false);
    try {
      const isUnreadOnly = filterTab === 'unread';
      const categoryFilter = ['all', 'unread'].includes(filterTab) ? undefined : filterTab;

      const res = await notificationService.getNotifications(isUnreadOnly, categoryFilter);
      if (res) {
        setNotifications(res.items);
        setUnreadCount(res.unread_count);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTab]);

  const handleEvaluateReminders = async () => {
    setEvaluating(true);
    setGenerateMessage('');
    try {
      const res = await notificationService.generateNotifications();
      if (res) {
        setGenerateMessage(res.message);
        await loadNotificationsData();
        setTimeout(() => setGenerateMessage(''), 5000);
      }
    } catch (e: unknown) {
      console.warn('Evaluation failed:', e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleMarkSingleRead = async (id: number) => {
    const res = await notificationService.markNotificationRead(id);
    if (res) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    const count = await notificationService.markAllNotificationsRead();
    if (count > 0 || unreadCount > 0) {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hydration':
        return <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'consistency':
      case 'nutrition':
        return <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'activity':
        return <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'goal':
        return <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'weight':
        return <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'meal_plan':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'weekly_summary':
        return <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionLink = (action?: string | null) => {
    if (!action) return null;
    switch (action) {
      case 'log_water':
        return { label: 'Log Water', path: '/app/diary' };
      case 'log_food':
        return { label: 'Log Food', path: '/app/diary' };
      case 'track_activity':
        return { label: 'Activity Log', path: '/app/activity' };
      case 'view_goals':
        return { label: 'View Goals', path: '/app/goals' };
      case 'open_meal_plan':
        return { label: 'Meal Plan', path: '/app/meal-plan' };
      case 'log_weight':
        return { label: 'Log Weight', path: '/app/weight' };
      case 'view_reports':
        return { label: 'View Analytics', path: '/app/reports' };
      default:
        return { label: 'Open', path: '/app' };
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'consistency', label: 'Meals' },
    { key: 'hydration', label: 'Hydration' },
    { key: 'activity', label: 'Activity' },
    { key: 'goal', label: 'Goals' },
    { key: 'meal_plan', label: 'Meal Plans' },
    { key: 'weekly_summary', label: 'Weekly Summaries' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Notifications &amp; Reminders
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Personalized health prompts derived strictly from your database telemetry.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleEvaluateReminders}
            disabled={evaluating}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>Evaluate Telemetry</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All Read</span>
            </button>
          )}

          <Link
            to="/settings"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Notification Settings"
          >
            <Sliders className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Evaluation Feedback Message */}
      {generateMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{generateMessage}</span>
        </div>
      )}

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Notifications couldn't be loaded from the server right now.</span>
          </div>
          <button
            type="button"
            onClick={loadNotificationsData}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all text-xs font-semibold cursor-pointer shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 2. FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              filterTab === tab.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. NOTIFICATION ITEMS LIST */}
      <div className="space-y-3">
        {loading ? (
          /* Skeleton Loader */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="max-w-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {filterTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {filterTab === 'unread'
                  ? 'All your health reminders and goal milestones have been read.'
                  : 'Notifications are generated dynamically as you log meals, weight, hydration, and activity.'}
              </p>
            </div>
          </div>
        ) : (
          /* Notifications Render */
          notifications.map((notif) => {
            const actionInfo = getActionLink(notif.action);
            const dateStr = new Date(notif.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.is_read
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(notif.notification_type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {notif.notification_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {actionInfo && (
                    <Link
                      to={actionInfo.path}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer min-h-[38px]"
                    >
                      <span>{actionInfo.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {!notif.is_read && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(notif.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-all cursor-pointer min-h-[38px]"
                      title="Mark as read"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
