import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Utensils,
  Calculator,
  PieChart,
  Scale,
  Activity,
  BookOpen,
  FileText,
  Sparkles,
  Target,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation('navigation');

  const navItems = [
    { key: 'dashboard', path: '/app', icon: LayoutDashboard },
    { key: 'diary', path: '/app/diary', icon: Calendar },
    { key: 'goals', path: '/app/goals', icon: Target },
    { key: 'insights', path: '/app/health-insights', icon: Lightbulb },
    { key: 'meal_plan', path: '/app/meal-plan', icon: Sparkles },
    { key: 'foods', path: '/app/foods', icon: Utensils },
    { key: 'calculator', path: '/app/calculator', icon: Calculator },
    { key: 'nutrition', path: '/app/nutrition', icon: PieChart },
    { key: 'weight', path: '/app/weight', icon: Scale },
    { key: 'activity', path: '/app/activity', icon: Activity },
    { key: 'recipes', path: '/app/recipes', icon: BookOpen },
    { key: 'reports', path: '/app/reports', icon: FileText },
    { key: 'privacy_data', path: '/app/privacy-data', icon: ShieldCheck },
  ];

  return (
    <aside className="w-72 bg-surface-container-lowest border-r border-surface-container-low flex flex-col h-screen sticky top-0 shrink-0 hidden lg:flex overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-surface-container-low flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
            <Sparkles className="w-5 h-5 text-primary-fixed" />
          </div>
          <div className="flex flex-col">
            <Link to="/app" className="font-headline-sm text-headline-sm text-primary tracking-tight leading-none">
              {t('brand_title', 'PoshanCare')}
            </Link>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">
              {t('brand_subtitle', 'Clinical Intelligence')}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1" aria-label="Main Navigation">
          <p className="px-3 text-label-sm text-outline uppercase tracking-wider mb-2 font-semibold">
            {t('clinical_modules', 'Clinical Modules')}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-md text-label-md transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-fixed' : 'text-outline'}`} />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
