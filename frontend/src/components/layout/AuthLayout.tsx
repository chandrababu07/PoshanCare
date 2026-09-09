import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-[1280px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          {/* Logo & Brand Unit */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-primary-fixed" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">
                PoshanCare
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium tracking-wide uppercase">
                Clinical Nutrition Intelligence
              </span>
            </div>
          </Link>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-primary">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="font-label-sm text-label-sm text-primary tracking-wide font-semibold">
                Clinical Privacy Verified
              </span>
            </div>
            <Link
              to="/"
              className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              ← Back to Overview
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-28 pb-12 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
