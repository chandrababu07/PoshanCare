import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, User, Calendar, Sliders, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const displayName = user?.full_name || 'User';

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Active Member';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          User Account Profile
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Overview of your authenticated credentials, privacy options, and health preferences.
        </p>
      </div>

      {/* Main Profile Details Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                  Verified Account
                </span>
                <span className="text-xs text-slate-400">
                  Provider: {user?.auth_provider || 'email'}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/app/privacy-data"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy &amp; Health Data</span>
          </Link>
        </div>

        {/* Profile Key Details Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-500 block">Full Display Name</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{displayName}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-500 block">Account Creation Date</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Link Cards */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/app/privacy-data"
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Download Data Export</span>
                <span className="text-[11px] text-slate-500">JSON health record export</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/onboarding/profile"
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-emerald-600 group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Edit Metabolic Target</span>
                <span className="text-[11px] text-slate-500">Update height, weight &amp; goals</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
