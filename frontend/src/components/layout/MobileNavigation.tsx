import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
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

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('navigation_drawer', 'Navigation drawer')}
        className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-surface-container-lowest shadow-xl flex flex-col justify-between p-6 overflow-y-auto"
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-surface-container-low">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold">
                <Sparkles className="w-4 h-4 text-primary-fixed" />
              </div>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                {t('brand_title', 'PoshanCare')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              aria-label={t('close_menu', 'Close menu')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="py-6 space-y-1.5" aria-label="Mobile application navigation">
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
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl font-label-md text-label-md transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-fixed' : 'text-outline'}`}
                  />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-surface-container-low">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            {t('brand_title', 'PoshanCare')} {t('brand_subtitle', 'Clinical Intelligence')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
