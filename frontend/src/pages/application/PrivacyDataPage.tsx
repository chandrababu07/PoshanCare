import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  Database,
  Calendar,
  Utensils,
  Scale,
  Droplets,
  Activity,
  Target,
  Sparkles,
  BookOpen,
  FileText,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAccountSummary,
  exportAccountData,
  deleteAccount,
  AccountSummaryResponse,
} from '../../services/accountService';

export const PrivacyDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState<AccountSummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string>('');

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  const loadSummaryData = async () => {
    setLoadingSummary(true);
    const data = await getAccountSummary();
    if (data) {
      setSummary(data);
    }
    setLoadingSummary(false);
  };

  useEffect(() => {
    loadSummaryData();
  }, []);

  const handleExportData = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError('');

    try {
      await exportAccountData();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Data export failed. Please try again.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();
      await logout();
      navigate('/signin', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Account deletion failed. Please try again.';
      setDeleteError(msg);
      setIsDeleting(false);
    }
  };

  const getRecordLabel = (count: number | undefined) => {
    if (count === undefined || count === null || count === 0) {
      return <span className="text-slate-400 dark:text-slate-500 font-normal italic">No records yet</span>;
    }
    return <span className="font-bold text-slate-900 dark:text-white">{count.toLocaleString()} {count === 1 ? 'record' : 'records'}</span>;
  };

  const formattedJoinDate = summary?.created_at
    ? new Date(summary.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Member';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. HEADER & IDENTITY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider">
                {summary?.profile_type || 'Adult'} Profile
              </span>
              <span className="text-xs text-slate-500">Joined {formattedJoinDate}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Privacy &amp; Health Data Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Complete control, category breakdown, structured JSON export, and permanent account deletion.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSummaryData}
          disabled={loadingSummary}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
          <span>Refresh Data Stats</span>
        </button>
      </div>

      {/* 2. PRIVACY STATEMENT BANNER */}
      <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-3.5 text-emerald-900 dark:text-emerald-200">
        <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100 mb-0.5">
            Your Health Data Belongs to You
          </p>
          <p>
            PoshanCare provides controls to help you manage your personal health data. We use your information strictly to calculate individualized energy targets, ICMR-NIN 2024 micronutrient distributions, and long-term metabolic health trends. We never sell or share your personal health records.
          </p>
        </div>
      </div>

      {/* 3. STORED DATA CATEGORIES SUMMARY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Data Categories Stored in Your Account
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {summary ? `${summary.email}` : user?.email}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* User Profile */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Profile &amp; Demographics</span>
                <span className="text-xs">{getRecordLabel(1)}</span>
              </div>
            </div>
          </div>

          {/* Food Diary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Food Diary Meals</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.meals)}</span>
              </div>
            </div>
          </div>

          {/* Weight History */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Weight Log History</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.weight_logs)}</span>
              </div>
            </div>
          </div>

          {/* Hydration */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Hydration Logs</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.hydration_logs)}</span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Activity Telemetry</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.activity_logs)}</span>
              </div>
            </div>
          </div>

          {/* Meal Plans */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Smart Meal Plans</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.meal_plans)}</span>
              </div>
            </div>
          </div>

          {/* Custom Recipes */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Custom Recipes</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.recipes)}</span>
              </div>
            </div>
          </div>

          {/* Custom & Favorite Foods */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Custom &amp; Favorite Foods</span>
                <span className="text-xs">
                  {getRecordLabel(
                    (summary?.record_counts?.custom_foods || 0) + (summary?.record_counts?.favorite_foods || 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Health Goals</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.health_goals)}</span>
              </div>
            </div>
          </div>

          {/* Clinical Reports */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between lg:col-span-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900 dark:text-white">Clinical Nutrition Audit Reports</span>
                <span className="text-xs">{getRecordLabel(summary?.record_counts?.clinical_reports)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. HEALTH DATA EXPORT SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Export Your Personal Health Data
          </h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Request a complete structured JSON export of all your personal records. The download includes your profile measurements, daily food logs, weight entries, hydration records, activity metrics, custom recipes, and clinical reports. Password hashes and authentication secrets are excluded for security.
        </p>

        {exportSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Health data export generated successfully and downloaded to your device.</span>
          </div>
        )}

        {exportError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Health Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download My Data (JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. DESTRUCTIVE DANGER ZONE / ACCOUNT DELETION */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-6 sm:p-8 border border-rose-200/80 dark:border-rose-900/50 space-y-4">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h2 className="text-lg font-bold">Danger Zone: Account Deletion</h2>
        </div>

        <p className="text-xs text-rose-900/80 dark:text-rose-200/80 max-w-2xl leading-relaxed">
          Permanently remove your account and purge all associated personal health logs, weight histories, hydration records, custom recipes, and clinical reports from PoshanCare servers.
        </p>

        <div>
          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteConfirmText('');
              setDeleteError('');
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION DELETION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Account Permanently?
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="font-semibold text-rose-600 dark:text-rose-400">
                ⚠️ Warning: This action cannot be undone.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                <li>Your profile, food logs, weight entries, and activity logs will be permanently deleted.</li>
                <li>Your custom recipes and clinical reports will be purged.</li>
                <li>Global Indian food database reference items will remain available to other users.</li>
                <li>You will be signed out immediately upon completion.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
              {deleteError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{deleteError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Permanent Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyDataPage;
